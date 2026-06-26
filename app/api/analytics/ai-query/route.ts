import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import Groq from 'groq-sdk'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    question?: string
    context?: {
      totalRevenue: number
      totalOrders: number
      emailOpenRate: number
      clickRate: number
      convRate: number
      emailRevenue: number
      waRevenue: number
    }
  }

  if (!body.question?.trim()) {
    return NextResponse.json({ error: 'Soru boş olamaz' }, { status: 400 })
  }

  const ctx = body.context
  const systemPrompt = [
    'Sen Marksio e-ticaret platformunun analitik AI asistanısın.',
    'Kullanıcının verisini analiz ederek kısa, somut ve uygulanabilir tavsiyeler veriyorsun.',
    'Yanıtlar maksimum 3-4 cümle olsun. Türkçe konuş. Resmi ama samimi bir ton kullan.',
    '',
    'MEVCUT ANALİTİK VERİLER:',
    `- Toplam Gelir: ₺${ctx?.totalRevenue ?? 0}`,
    `- Toplam Sipariş: ${ctx?.totalOrders ?? 0}`,
    `- E-posta Açılma Oranı: %${ctx?.emailOpenRate ?? 0}`,
    `- Tıklama Oranı: %${ctx?.clickRate ?? 0}`,
    `- Dönüşüm Oranı: %${ctx?.convRate ?? 0}`,
    `- E-posta Geliri: ₺${ctx?.emailRevenue ?? 0}`,
    `- WhatsApp Geliri: ₺${ctx?.waRevenue ?? 0}`,
  ].join('\n')

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.question },
      ],
      max_tokens: 300,
      temperature: 0.65,
    })
    const reply = completion.choices[0]?.message?.content?.trim() ?? 'Yanıt oluşturulamadı.'
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('[Analytics AI Query]', err)
    return NextResponse.json({ error: 'AI yanıtı oluşturulamadı. GROQ_API_KEY kontrol edin.' }, { status: 500 })
  }
}
