import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import Groq from 'groq-sdk'
import { buildPremiumEmail } from '@/lib/premium-email-builder'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const {
    templateId,
    storeName,
    headline,
    subheadline,
    discount,
    couponCode,
    ctaText,
    ctaUrl,
    stylePrompt,
    productImage,
    productName,
    productPrice,
  } = await req.json()

  let generatedContent: { headline: string; subheadline: string; body: string; cta: string } | null = null

  try {
    const templateLabels: Record<string, string> = {
      promotion: 'Promosyon & İndirim',
      abandoned_cart: 'Sepet Terk - Geri Kazanım',
      new_product: 'Yeni Ürün Lansmanı',
      winback: 'Pasif Müşteri Geri Kazanım',
      vip: 'VIP Müşteri Özel Teklif',
      welcome: 'Hoş Geldin',
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.75,
      messages: [
        {
          role: 'system',
          content: `Sen Türk e-ticaret mağazaları için email pazarlama içeriği yazan bir uzman copywriter'sın.
Verilen bilgilere göre kısa, etkileyici, dönüşüm odaklı Türkçe metinler yazarsın.
JSON formatında yanıt ver.`,
        },
        {
          role: 'user',
          content: `Email şablon tipi: ${templateLabels[templateId] || templateId}
Mağaza adı: ${storeName || 'Demo Mağaza'}
${headline ? `Kullanıcı başlığı: ${headline}` : ''}
${subheadline ? `Alt başlık ipucu: ${subheadline}` : ''}
${discount ? `İndirim oranı: ${discount}` : ''}
${couponCode ? `Kupon kodu: ${couponCode}` : ''}
${productName ? `Ürün: ${productName}` : ''}
${productPrice ? `Fiyat: ${productPrice}` : ''}
${ctaText ? `CTA butonu: ${ctaText}` : ''}
Stil & ton: ${stylePrompt || 'Dostane, sıcak ve profesyonel'}

Bu email için aşağıdakileri üret:
- headline: Çarpıcı ana başlık (max 8 kelime, büyük harf veya normal)
- subheadline: Destekleyici alt başlık (max 12 kelime)
- body: Email gövde metni (2-3 cümle, ikna edici, müşteriye hitap eden)
- cta: Aksiyon butonu metni (max 5 kelime)

JSON: { "headline": "...", "subheadline": "...", "body": "...", "cta": "..." }`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    generatedContent = JSON.parse(completion.choices[0].message.content || '{}')
  } catch {
    // Groq hatası durumunda kullanıcı girişlerini kullan
  }

  const accentMap: Record<string, string> = {
    promotion: '#ea5c1e', abandoned_cart: '#d97706', new_product: '#7c3aed',
    winback: '#d97706', vip: '#1a1a1a', welcome: '#059669',
  }
  const badgeMap: Record<string, string> = {
    promotion: 'SIZE ÖZEL FIRSAT!', abandoned_cart: 'SEPETİNİZ SİZİ BEKLİYOR',
    new_product: 'YENİ KOLEKSİYON', winback: 'SİZİ ÖZLEDİK!',
    vip: 'VIP ÜYELERİMİZE ÖZEL', welcome: 'HOŞ GELDİNİZ!',
  }
  const tplId = templateId || 'promotion'

  const html = buildPremiumEmail({
    storeName: storeName || 'Demo Mağaza',
    accentColor: accentMap[tplId] ?? '#ea5c1e',
    badge: badgeMap[tplId],
    headline: generatedContent?.headline || headline || 'Özel Kampanya',
    subheadline: generatedContent?.subheadline || subheadline || '',
    body: generatedContent?.body || 'Kampanya detayları için tıklayın.',
    cta: generatedContent?.cta || ctaText || 'Hemen İncele',
    ctaUrl: ctaUrl || '#',
    discount: discount ? String(discount).replace('%', '') : undefined,
    couponCode: couponCode || undefined,
    heroImage: productImage || undefined,
  })

  return NextResponse.json({ html, content: generatedContent })
}
