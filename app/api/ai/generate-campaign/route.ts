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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { purpose, name, productDescription, discountRate, brandTone, storeName } = await req.json()

  if (!purpose || !productDescription) {
    return NextResponse.json({ error: 'purpose ve productDescription zorunlu' }, { status: 400 })
  }

  const purposeLabel = PURPOSE_LABELS[purpose] || purpose
  const discount = discountRate ? `%${discountRate} indirim` : 'indirim yok'

  const prompt = `Sen uzman bir e-posta pazarlama copywriter'ısın. Aşağıdaki bilgilere göre profesyonel bir e-posta kampanyası içeriği üret.

Kampanya Amacı: ${purposeLabel}
Kampanya Adı: ${name || 'Belirtilmemiş'}
Ürün/Hizmet: ${productDescription}
İndirim: ${discount}
Marka Tonu: ${brandTone || 'Profesyonel ve Güvenilir'}
Marka: ${storeName || 'Marka'}

SADECE aşağıdaki JSON formatında yanıt ver, başka hiçbir şey yazma:
{
  "subject": "E-posta konusu - max 55 karakter, emoji kullanabilirsin, açma oranını artıracak şekilde",
  "previewText": "İnbox önizleme metni - max 85 karakter, merak uyandıran, konuyu tamamlayan",
  "headline": "E-posta ana başlığı - max 10 kelime, güçlü ve dikkat çekici",
  "body": "E-posta gövde metni - 2-3 kısa paragraf, satın almaya teşvik eden, samimi ve ikna edici. Her paragraf arasında boş satır bırak.",
  "ctaText": "CTA butonu metni - max 5 kelime, aksiyon odaklı, Türkçe",
  "imagePrompt": "Fal.ai için görsel prompt - İngilizce, detaylı commercial photography, e-commerce email hero banner için uygun"
}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 1200,
    })

    const raw = completion.choices[0]?.message?.content ?? ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('JSON yanıtı bulunamadı')

    const result = JSON.parse(match[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error('[AI Generate Campaign]', err)
    return NextResponse.json({ error: 'İçerik üretilemedi' }, { status: 500 })
  }
}
