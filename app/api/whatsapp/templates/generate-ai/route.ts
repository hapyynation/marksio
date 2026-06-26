import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { groq, GROQ_MODEL } from '@/lib/groq'

function safeJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON bulunamadı')
  try { return JSON.parse(match[0]) } catch {
    return JSON.parse(match[0].replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, ' '))
  }
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    bodyText?: string
    buttonText?: string
    buttonUrl?: string
  }
  if (!body.bodyText?.trim()) {
    return NextResponse.json({ error: 'Mesaj metni gerekli.' }, { status: 400 })
  }

  const buttonLine = body.buttonText?.trim()
    ? `- BUTTONS component ekle: type "URL", text "${body.buttonText.trim()}", url "${body.buttonUrl?.trim() || 'https://example.com'}"`
    : '- BUTTONS ekleme'

  const prompt = `Senden tek bir şey istiyorum: aşağıdaki metni Meta WhatsApp Business API template JSON formatına dönüştür.

KULLANICININ YAZDIGI MESAJ (bu metni kelimesi kelimesine kullan, hiçbir şeyi değiştirme):
"${body.bodyText.trim()}"

KURALLAR:
1. "BODY" component "text" alanı, yukarıdaki metnin birebir kopyası olmalı — tek karakter bile ekleme, silme veya değiştirme yapma
2. HEADER ekleme
3. FOOTER ekleme
4. Değişken ({{1}} gibi) ekleme — metinde zaten varsa tut, yoksa ekleme
5. ${buttonLine}
6. name: metnin konusunu yansıtan lowercase_underscore_isim (max 60 karakter)
7. category: MARKETING veya UTILITY (içeriğe göre)
8. language: "tr"

SADECE geçerli JSON döndür:
{
  "name": "template_adi",
  "category": "MARKETING",
  "categoryReason": "neden bu kategori (1 cümle)",
  "language": "tr",
  "components": [
    { "type": "BODY", "text": "kullanicinin yazdigi metin aynen buraya" }
  ],
  "variableExamples": {},
  "estimatedCostPerMessage": 0.029,
  "tips": ["ipucu1"]
}`

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'Meta WhatsApp Business API JSON formatter\'sın. Kullanıcının metnini DEĞİŞTİRMEDEN yapılandır. SADECE geçerli JSON döndür.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const result = safeJson(text)

    if (!result.name || !result.category || !Array.isArray(result.components)) {
      return NextResponse.json({ error: 'AI yanıtı geçersiz format.' }, { status: 500 })
    }

    const COST: Record<string, number> = { MARKETING: 0.029, UTILITY: 0.0024, AUTHENTICATION: 0.0155 }
    result.estimatedCostPerMessage = COST[result.category] ?? 0.029

    return NextResponse.json(result)
  } catch (err) {
    console.error('[generate-ai] error:', err)
    return NextResponse.json({ error: 'AI şablon oluşturulamadı.' }, { status: 500 })
  }
}
