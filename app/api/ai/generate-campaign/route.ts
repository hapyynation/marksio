import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const PURPOSE_LABELS: Record<string, string> = {
  cart_abandoned: 'Sepeti Terk Edenler',
  vip: 'VIP Müşteriler',
  new_customers: 'Yeni Müşteriler',
  discount: 'İndirim Kampanyası',
  black_friday: 'Black Friday',
  product_launch: 'Ürün Tanıtımı',
  repurchase: 'Tekrar Satın Alma',
  win_back: 'Pasif Müşteriyi Geri Kazanma',
}

const SEGMENT_MAP: Record<string, string> = {
  cart_abandoned: 'cart_abandoned',
  vip: 'vip',
  new_customers: 'new',
  discount: 'all',
  black_friday: 'all',
  product_launch: 'all',
  repurchase: 'loyal',
  win_back: 'at_risk',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const {
    purpose,
    name,
    productDescription,
    discountRate,
    brandTone,
    ctaPurpose,
    layoutStyle,
    storeName,
  } = await req.json()

  if (!purpose || !productDescription) {
    return NextResponse.json({ error: 'purpose ve productDescription zorunlu' }, { status: 400 })
  }

  const purposeLabel = PURPOSE_LABELS[purpose] ?? purpose
  const discount = discountRate ? `%${discountRate} indirim` : 'indirim yok'
  const ctaHint = ctaPurpose ? `CTA amacı: ${ctaPurpose}` : ''

  const prompt = `Sen dünyaca ünlü bir e-posta pazarlama uzmanısın. Verilen bilgilere göre yüksek dönüşümlü bir e-posta kampanyası üret.

Kampanya Amacı: ${purposeLabel}
Kampanya Adı: ${name || 'Belirtilmemiş'}
Ürün/Hizmet: ${productDescription}
İndirim: ${discount}
Marka Tonu: ${brandTone || 'Profesyonel ve Güvenilir'}
Marka: ${storeName || 'Marka'}
${ctaHint}

Kurallar:
- Türkçe içerik üret (görsel prompt hariç).
- Spam tetikleyici kelimeler kullanma (ÜCRETSİZ, HEMEN, %100, KAZANDIN).
- Mail konusu max 55 karakter, emoji kullanabilirsin.
- Preview text konuyu tamamlasın, merak uyandırsın.
- Headline güçlü ve duygusal bağ kursun.
- Body 2-3 kısa paragraf, satın almaya yönlendirsin.
- CTA net ve aksiyon odaklı.
- Görsel prompt İngilizce, photorealistic commercial photography, e-commerce hero banner.
- layoutStyle sadece şunlardan biri olsun: luxury | minimal | black-friday | skincare | fashion | tech | furniture | gaming

SADECE aşağıdaki JSON formatında dön, başka hiçbir şey yazma:
{
  "subject": "",
  "previewText": "",
  "headline": "",
  "body": "",
  "ctaText": "",
  "imagePrompt": "",
  "layoutStyle": "",
  "brandTone": "",
  "recommendedSegment": "",
  "personalizationVariables": ["{{firstName}}", "{{productName}}"],
  "smsVariant": "",
  "whatsappVariant": ""
}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.72,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw)

    // Fallbacks
    if (!result.recommendedSegment) {
      result.recommendedSegment = SEGMENT_MAP[purpose] ?? 'all'
    }
    if (!result.personalizationVariables) {
      result.personalizationVariables = ['{{firstName}}']
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[AI Generate Campaign]', err)
    return NextResponse.json({ error: 'İçerik üretilemedi' }, { status: 500 })
  }
}
