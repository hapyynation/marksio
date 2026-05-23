import { NextRequest, NextResponse } from 'next/server'
import { groq, GROQ_MODEL } from '@/lib/groq'
import { buildPremiumEmail, EmailContent } from '@/lib/premium-email-builder'

function safeParseJSON(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try { return JSON.parse(cleaned) } catch {
    try { return JSON.parse(cleaned.replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, ' ')) } catch { return null }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, storeName = 'Mağazam', accentColor, heroImage, products = [] } = body

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'prompt zorunlu' }, { status: 400 })
    }

    const systemPrompt = `Sen bir premium e-posta pazarlama uzmanısın. Kullanıcının isteğine göre email içeriğini JSON olarak üret.
SADECE geçerli JSON döndür, başka hiçbir şey yazma.`

    const userPrompt = `Mağaza: ${storeName}
Kullanıcı isteği: ${prompt}

Aşağıdaki JSON formatında email içeriği üret. Türkçe yaz, profesyonel ve çekici ol:
{
  "badge": "SIZE ÖZEL FIRSAT!" gibi kısa dikkat çekici rozet (opsiyonel, 4-5 kelime),
  "headline": "Büyük başlık, dikkat çekici, kısa (örn: SEPETTE %15 İNDİRİM)",
  "subheadline": "50-80 karakter email önizleme metni",
  "body": "2-3 cümle açıklama, neden almalı, avantajlar (HTML tag yok)",
  "discount": "Sadece sayı, varsa (örn: 15). Yoksa null",
  "couponCode": "BÜYÜK HARF kod, varsa (örn: MARKA20). Yoksa null",
  "cta": "Buton metni (örn: ALIŞVERİŞE BAŞLA, HEMEN İNCELE)",
  "subject": "Email konu satırı, 40-60 karakter",
  "accentColor": "Kampanya temasına uygun hex renk (örn: indirim=#ea5c1e, vip=#1a1a1a, welcome=#059669)"
}`

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.6,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI yanıtı geçersiz format')

    const parsed = safeParseJSON(match[0])
    if (!parsed) throw new Error('JSON parse hatası')

    const content: EmailContent = {
      storeName,
      accentColor: accentColor ?? parsed.accentColor ?? '#ea5c1e',
      badge: parsed.badge ?? undefined,
      headline: parsed.headline ?? 'Özel Kampanya',
      subheadline: parsed.subheadline ?? '',
      body: parsed.body ?? '',
      discount: parsed.discount ? String(parsed.discount) : undefined,
      couponCode: parsed.couponCode ?? undefined,
      cta: parsed.cta ?? 'Hemen İncele',
      heroImage: heroImage ?? undefined,
      products: products.length > 0 ? products : undefined,
    }

    const html = buildPremiumEmail(content)

    return NextResponse.json({
      html,
      content,
      subject: parsed.subject ?? content.headline,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Email üretilemedi'
    console.error('[email-generate]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
