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

  const body = await req.json() as { description?: string }
  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Kampanya açıklaması gerekli.' }, { status: 400 })
  }

  const prompt = `WhatsApp Business API şablonu oluştur.

Kullanıcı isteği: "${body.description}"

Meta kuralları:
- İsim: küçük harf, alt çizgi, max 512 karakter
- BODY max 1024 karakter
- HEADER max 60 karakter (TEXT formatı)
- Değişkenler: {{1}}, {{2}} şeklinde (sıralı)
- MARKETING: promosyon, indirim, duyuru
- UTILITY: sipariş güncelleme, iade, bildirim
- AUTHENTICATION: OTP, doğrulama kodu

SADECE geçerli JSON döndür:
{
  "name": "lowercase_underscore_template_name",
  "category": "MARKETING|UTILITY|AUTHENTICATION",
  "categoryReason": "neden bu kategori (1 cümle)",
  "language": "tr",
  "components": [
    { "type": "HEADER", "format": "TEXT", "text": "Başlık (max 60 karakter)" },
    { "type": "BODY", "text": "Mesaj içeriği. {{1}} gibi değişkenler kullanılabilir." },
    { "type": "FOOTER", "text": "Kısa dipnot" },
    { "type": "BUTTONS", "buttons": [{ "type": "QUICK_REPLY", "text": "Buton metni" }] }
  ],
  "variableExamples": { "1": "örnek değer 1", "2": "örnek değer 2" },
  "estimatedCostPerMessage": 0.029,
  "tips": ["ipucu1", "ipucu2"]
}`

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'Meta WhatsApp Business API şablonu uzmanısın. SADECE geçerli JSON döndür.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.4,
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const result = safeJson(text)

    if (!result.name || !result.category || !Array.isArray(result.components)) {
      return NextResponse.json({ error: 'AI yanıtı geçersiz format.' }, { status: 500 })
    }

    const COST: Record<string, number> = { MARKETING: 0.029, UTILITY: 0.0024, AUTHENTICATION: 0.0155 }
    result.estimatedCostPerMessage = COST[result.category] ?? 0.029

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'AI şablon oluşturulamadı.' }, { status: 500 })
  }
}
