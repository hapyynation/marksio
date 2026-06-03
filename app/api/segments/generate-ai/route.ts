import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { matchesRules, type SegmentRule } from '@/lib/segment-engine'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface CustomerStats {
  total: number
  withOrders: number
  avgSpent: number
  avgOrders: number
  maxSpent: number
  vipCount: number      // totalSpent > 10000
  loyalCount: number    // totalOrders >= 5
  recentCount: number   // lastOrder < 30 days
  atRiskCount: number   // lastOrder 60-90 days
  inactiveCount: number // lastOrder > 180 days
  newCount: number      // totalOrders <= 1
}

function computeStats(customers: {
  totalSpent: number; totalOrders: number; lastOrder: Date | null
}[]): CustomerStats {
  const total = customers.length
  const now = Date.now()
  const day = 86_400_000

  let withOrders = 0, totalSpent = 0, totalOrds = 0, maxSpent = 0
  let vip = 0, loyal = 0, recent = 0, atRisk = 0, inactive = 0, newC = 0

  for (const c of customers) {
    const days = c.lastOrder ? Math.floor((now - new Date(c.lastOrder).getTime()) / day) : 99999
    if (c.totalOrders > 0) withOrders++
    totalSpent += c.totalSpent
    totalOrds  += c.totalOrders
    if (c.totalSpent > maxSpent) maxSpent = c.totalSpent
    if (c.totalSpent >= 10000 && c.totalOrders >= 5) vip++
    if (c.totalOrders >= 5) loyal++
    if (days <= 30) recent++
    if (days >= 60 && days < 90) atRisk++
    if (days >= 180) inactive++
    if (c.totalOrders <= 1) newC++
  }

  return {
    total, withOrders,
    avgSpent:   total > 0 ? Math.round(totalSpent / total) : 0,
    avgOrders:  total > 0 ? Math.round((totalOrds / total) * 10) / 10 : 0,
    maxSpent:   Math.round(maxSpent),
    vipCount:   vip, loyalCount: loyal, recentCount: recent,
    atRiskCount: atRisk, inactiveCount: inactive, newCount: newC,
  }
}

interface AiSegment {
  name: string
  description: string
  rules: SegmentRule[]
  matchType: 'all' | 'any'
  color: string
  icon: string
}

const FALLBACK_SEGMENTS: AiSegment[] = [
  {
    name: 'VIP Müşteriler',
    description: '₺10.000+ harcama ve 5+ sipariş',
    rules: [{ field: 'totalSpent', operator: 'gte', value: 10000 }, { field: 'totalOrders', operator: 'gte', value: 5 }],
    matchType: 'all', color: '#f0a020', icon: '👑',
  },
  {
    name: 'Sadık Müşteriler',
    description: '5 veya daha fazla sipariş',
    rules: [{ field: 'totalOrders', operator: 'gte', value: 5 }],
    matchType: 'all', color: '#4470ff', icon: '🤝',
  },
  {
    name: 'Risk Altındakiler',
    description: '60-90 gündür alışveriş yok',
    rules: [{ field: 'daysSinceOrder', operator: 'gte', value: 60 }, { field: 'daysSinceOrder', operator: 'lt', value: 90 }],
    matchType: 'all', color: '#f0a020', icon: '⚠️',
  },
  {
    name: 'Yeni Müşteriler',
    description: '0-1 sipariş',
    rules: [{ field: 'totalOrders', operator: 'lte', value: 1 }],
    matchType: 'all', color: '#22c97a', icon: '✨',
  },
  {
    name: 'Pasif Müşteriler',
    description: '180+ gün sessiz',
    rules: [{ field: 'daysSinceOrder', operator: 'gte', value: 180 }],
    matchType: 'all', color: '#8080a0', icon: '💤',
  },
  {
    name: 'Son Alışveriş Yapanlar',
    description: 'Son 30 günde sipariş',
    rules: [{ field: 'daysSinceOrder', operator: 'lte', value: 30 }],
    matchType: 'all', color: '#22c97a', icon: '🛒',
  },
]

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = session.user.id

  // Fetch existing segment names to avoid duplicates
  const existing = await prisma.segment.findMany({
    where: { userId },
    select: { name: true },
  })
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()))

  // Fetch customer stats
  const customers = await prisma.customer.findMany({
    where: { userId },
    select: { totalSpent: true, totalOrders: true, lastOrder: true },
  })

  if (customers.length === 0) {
    return NextResponse.json({ created: 0, message: 'Müşteri verisi yok. Önce mağazanı senkronize et.' })
  }

  const stats = computeStats(customers)

  // Try Groq for smart, data-driven segments
  let aiSegments: AiSegment[] = []

  try {
    const prompt = `Sen bir e-ticaret segmentasyon uzmanısın. Aşağıdaki mağaza müşteri verisini analiz et ve en değerli 6 müşteri segmentini JSON olarak üret.

Müşteri İstatistikleri:
- Toplam müşteri: ${stats.total}
- Sipariş veren: ${stats.withOrders}
- Ortalama harcama: ₺${stats.avgSpent}
- Maks harcama: ₺${stats.maxSpent}
- VIP (~₺10K+, 5+ sipariş): ${stats.vipCount}
- Sadık (5+ sipariş): ${stats.loyalCount}
- Son 30 günde aktif: ${stats.recentCount}
- Risk altında (60-90 gün sessiz): ${stats.atRiskCount}
- Pasif (180+ gün): ${stats.inactiveCount}
- Yeni (0-1 sipariş): ${stats.newCount}

Veriye dayalı, iş değeri yüksek 6 segment üret. Her segment için uygun eşikler belirle.

Kural field'ları: totalSpent, totalOrders, avgOrder, daysSinceOrder, score, source
Operator'lar: gt, lt, gte, lte, eq, neq, contains, not_contains
icon: emoji (👑💎🤝✨⚠️💤🛒🎯🔥💙)

JSON:
{
  "segments": [
    {
      "name": "Segment Adı",
      "description": "Kısa açıklama (Türkçe)",
      "rules": [{"field": "...", "operator": "...", "value": 0}],
      "matchType": "all",
      "color": "#hex",
      "icon": "emoji"
    }
  ]
}`

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed.segments) && parsed.segments.length > 0) {
      aiSegments = parsed.segments
    }
  } catch {
    // Fall back to static segments
  }

  const toCreate: AiSegment[] = aiSegments.length > 0 ? aiSegments : FALLBACK_SEGMENTS

  // Create segments that don't exist yet
  let created = 0
  const createdSegments = []

  for (const seg of toCreate) {
    if (existingNames.has(seg.name.toLowerCase())) continue

    const rules = Array.isArray(seg.rules) ? seg.rules : []
    const matchType = (seg.matchType ?? 'all') as 'all' | 'any'

    // Compute count from real customer data
    const fullCustomers = await prisma.customer.findMany({
      where: { userId },
      select: { totalSpent: true, totalOrders: true, avgOrder: true, lastOrder: true, tags: true, source: true, segment: true, score: true },
    })
    const count = fullCustomers.filter(c => matchesRules(c, rules, matchType)).length

    const newSeg = await prisma.segment.create({
      data: {
        userId,
        name:        seg.name,
        description: seg.description ?? null,
        type:        'ai',
        rules:       JSON.stringify(rules),
        matchType,
        color:       seg.color ?? '#4470ff',
        icon:        seg.icon ?? '👥',
        count,
        active:      true,
      },
    })

    createdSegments.push({ ...newSeg, rules, count })
    existingNames.add(seg.name.toLowerCase())
    created++
  }

  return NextResponse.json({
    created,
    segments: createdSegments,
    stats,
    source: aiSegments.length > 0 ? 'groq' : 'fallback',
    message: created > 0
      ? `${created} AI segment oluşturuldu`
      : 'Tüm segmentler zaten mevcut',
  })
}
