import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function GET() {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  try {
    const customers = await prisma.customer.findMany({
      where: { userId },
      select: {
        totalSpent: true, totalOrders: true, avgOrder: true,
        lastOrder: true, score: true, source: true,
      },
    })

    if (customers.length === 0) {
      return NextResponse.json({ suggestions: getStaticSuggestions() })
    }

    const total = customers.length
    const avgSpent  = Math.round(customers.reduce((s, c) => s + c.totalSpent, 0) / total)
    const avgOrders = Math.round(customers.reduce((s, c) => s + c.totalOrders, 0) / total)
    const avgOrder  = Math.round(customers.reduce((s, c) => s + c.avgOrder, 0) / total)

    const now = Date.now()
    const inactive30  = customers.filter(c => c.lastOrder && (now - new Date(c.lastOrder).getTime()) / 86400000 > 30).length
    const inactive90  = customers.filter(c => !c.lastOrder || (now - new Date(c.lastOrder).getTime()) / 86400000 > 90).length
    const highSpend   = customers.filter(c => c.totalSpent >= avgSpent * 2).length
    const multiOrder  = customers.filter(c => c.totalOrders >= 3).length
    const singleOrder = customers.filter(c => c.totalOrders === 1).length

    const stats = { total, avgSpent, avgOrders, avgOrder, inactive30, inactive90, highSpend, multiOrder, singleOrder }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ suggestions: getStaticSuggestions(stats) })
    }

    const r = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Sen e-ticaret veri analisti ve segment uzmanısın. Müşteri istatistiklerine bakarak 3 adet değerli segment önerisi oluştur. Sadece JSON döndür.',
        },
        {
          role: 'user',
          content: `Müşteri istatistikleri: ${JSON.stringify(stats)}

3 adet segment önerisi oluştur. Her öneri için:
- title: kısa başlık (max 35 karakter)
- description: kısa açıklama (max 80 karakter)
- insight: potansiyel gelir veya fırsat notu
- rules: segment kuralları dizisi [{field, operator, value}]
  - field: totalSpent|totalOrders|daysSinceOrder|avgOrder
  - operator: gt|lt|gte|lte|eq
  - value: sayı (string değil)
- color: hex renk kodu (#rrggbb)
- icon: tek emoji

JSON format: {"suggestions": [{title, description, insight, rules, color, icon}]}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(r.choices[0].message.content || '{}') as {
      suggestions?: Array<{ title: string; description: string; insight: string; rules: unknown[]; color: string; icon: string }>
    }

    if (!parsed.suggestions?.length) {
      return NextResponse.json({ suggestions: getStaticSuggestions(stats) })
    }

    return NextResponse.json({ suggestions: parsed.suggestions })
  } catch (err) {
    console.error('[segment-suggestions]', err)
    return NextResponse.json({ suggestions: getStaticSuggestions() })
  }
}

function getStaticSuggestions(stats?: { avgSpent?: number; inactive90?: number; multiOrder?: number; highSpend?: number; singleOrder?: number; [key: string]: number | undefined }) {
  return [
    {
      title: 'Yüksek Potansiyelli Müşteriler',
      description: `Ortalamanın 2 katı harcama yapan ${stats?.highSpend ?? '~'} müşteri`,
      insight: `Potansiyel gelir: ₺${Math.round((stats?.avgSpent ?? 2000) * 2 * 0.2).toLocaleString('tr-TR')}`,
      rules: [
        { field: 'totalSpent',  operator: 'gte', value: Math.round((stats?.avgSpent ?? 1000) * 2) },
        { field: 'totalOrders', operator: 'gte', value: 3 },
      ],
      color: '#f59e0b', icon: '⭐',
    },
    {
      title: 'Tekrar Satın Alma Adayları',
      description: '30-60 gündür alışveriş yapmayan, geri kazanılabilir müşteriler',
      insight: 'Hedefli kampanya ile geri dönüş oranı %35+',
      rules: [
        { field: 'daysSinceOrder', operator: 'gte', value: 30 },
        { field: 'daysSinceOrder', operator: 'lt',  value: 60 },
      ],
      color: '#4470ff', icon: '🔄',
    },
    {
      title: 'Tek Alışveriş Yapanlar',
      description: 'Sadece 1 siparişleri olan müşteriler — ikinci satın almayı teşvik et',
      insight: `${stats?.singleOrder ?? '~'} müşteri, %25 dönüşüm potansiyeli`,
      rules: [{ field: 'totalOrders', operator: 'eq', value: 1 }],
      color: '#22c97a', icon: '🎯',
    },
  ]
}
