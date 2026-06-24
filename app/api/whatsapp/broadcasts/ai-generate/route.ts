import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { groq, GROQ_MODEL } from '@/lib/groq'

function safeParseJSON(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try { return JSON.parse(cleaned) } catch {
    const fixed = cleaned.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, ' ')
    return JSON.parse(fixed)
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as { description?: string }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Kampanya açıklaması gerekli.' }, { status: 400 })
  }

  const [user, customers] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { storeName: true } }),
    prisma.customer.findMany({
      where: { userId: session.user.id },
      select: { totalSpent: true, totalOrders: true, avgOrder: true, lastOrder: true, phone: true },
    }),
  ])

  const now = Date.now()
  const days = (d: Date | null) => d ? Math.floor((now - new Date(d).getTime()) / 86400000) : 99999
  const withPhone = customers.filter(c => c.phone)

  const segmentData = {
    all:         withPhone.length,
    vip:         withPhone.filter(c => c.totalSpent >= 10000 && c.totalOrders >= 10).length,
    loyal:       withPhone.filter(c => c.totalOrders >= 5).length,
    at_risk:     withPhone.filter(c => { const d = days(c.lastOrder); return d >= 60 && d < 90 }).length,
    recent_30:   withPhone.filter(c => days(c.lastOrder) <= 30).length,
    recent_60:   withPhone.filter(c => days(c.lastOrder) <= 60).length,
    inactive_90: withPhone.filter(c => days(c.lastOrder) >= 90).length,
    first_order: withPhone.filter(c => c.totalOrders === 1).length,
    high_spend:  withPhone.filter(c => c.totalSpent >= 5000).length,
  }

  const avgOrder = withPhone.length > 0
    ? Math.round(withPhone.reduce((a, c) => a + c.avgOrder, 0) / withPhone.length)
    : 0

  const prompt = `Mağaza: ${user?.storeName ?? 'Mağaza'}
Ortalama sipariş değeri: ₺${avgOrder}
Müşteri segment boyutları: ${JSON.stringify(segmentData)}

Kullanıcı isteği: "${body.description}"

WhatsApp broadcast kampanyası tasarla. SADECE geçerli JSON döndür:
{
  "name": "kısa kampanya adı (max 40 karakter)",
  "recommendedSegmentId": "all|vip|loyal|at_risk|recent_30|recent_60|inactive_90|first_order|high_spend",
  "segmentReason": "neden bu segment seçildi (1 cümle)",
  "message": "WhatsApp mesajı (max 160 kelime, emoji kullan, kişiselleştirme için {{1}} kullan)",
  "cta": "CTA butonu metni (max 25 karakter)",
  "utmCampaign": "url-dostu-kampanya-adi",
  "estimatedRevenue": 0,
  "tips": ["ipucu1", "ipucu2", "ipucu3"]
}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: 'WhatsApp pazarlama uzmanısın. SADECE geçerli JSON döndür, başka hiçbir şey yazma.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.55,
  })

  const responseText = completion.choices[0]?.message?.content ?? ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return NextResponse.json({ error: 'AI yanıtı işlenemedi.' }, { status: 500 })

  try {
    const result = safeParseJSON(jsonMatch[0])
    // Attach estimated revenue based on segment count and avg order
    const segId = result.recommendedSegmentId as keyof typeof segmentData
    const cnt = segmentData[segId] ?? segmentData.all
    const convRate = segId === 'vip' ? 0.25 : segId === 'loyal' || segId === 'high_spend' ? 0.18 : 0.10
    result.estimatedRevenue = Math.round(cnt * avgOrder * convRate)
    result.segmentCount = cnt
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'AI yanıtı işlenemedi.' }, { status: 500 })
  }
}
