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

// Category → layout style mapping
const CATEGORY_THEME: Record<string, string> = {
  fashion: 'fashion',
  Fashion: 'fashion',
  skincare: 'skincare',
  Skincare: 'skincare',
  tech: 'tech',
  Tech: 'tech',
  gaming: 'gaming',
  Gaming: 'gaming',
  furniture: 'furniture',
  Furniture: 'furniture',
  luxury: 'luxury',
  Luxury: 'luxury',
  jewelry: 'luxury',
  Jewelry: 'luxury',
  Accessories: 'fashion',
  accessories: 'fashion',
  sport: 'tech',
  Sport: 'tech',
  food: 'skincare',
  Food: 'skincare',
  home: 'furniture',
  Home: 'furniture',
}

interface ProductInput {
  productName?: string
  category?: string
  price?: string
  compareAtPrice?: string
  description?: string
}

function buildProductContext(products: ProductInput[]): string {
  if (!products || products.length === 0) return ''
  return `\nÜrünler (${products.length} adet):\n` + products.map((p, i) =>
    `${i + 1}. ${p.productName || 'Ürün'}` +
    (p.category ? ` — Kategori: ${p.category}` : '') +
    (p.price ? ` — Fiyat: ${p.price} TL` : '') +
    (p.compareAtPrice && p.compareAtPrice !== p.price ? ` (Normal: ${p.compareAtPrice} TL)` : '') +
    (p.description ? ` — ${p.description.slice(0, 80)}` : '')
  ).join('\n')
}

function detectThemeFromProducts(products: ProductInput[], existingStyle?: string): string {
  if (existingStyle && existingStyle !== 'default') return existingStyle
  for (const p of products) {
    if (p.category && CATEGORY_THEME[p.category]) return CATEGORY_THEME[p.category]
  }
  return 'default'
}

function buildVisualPrompt(products: ProductInput[], purpose: string, layoutStyle: string): string {
  const category = products[0]?.category?.toLowerCase() ?? ''
  const productName = products[0]?.productName ?? 'product'

  const categoryPrompts: Record<string, string> = {
    fashion: `Luxury ecommerce fashion campaign, realistic ${productName} editorial photoshoot, elegant soft golden hour sunlight, premium feminine aesthetic, luxury email hero banner, clean editorial composition, high-end fashion advertising style, ultra realistic commercial photography, not AI looking, 4K quality`,
    skincare: `Premium skincare product campaign, clean white marble surface, soft natural lighting, ${productName} beauty photography, pastel bokeh background, luxury cosmetics advertising, ultra realistic product photo, editorial beauty aesthetic, minimalist composition, professional studio quality`,
    tech: `Premium tech product campaign, dark studio background, dramatic blue LED lighting, ${productName} technology photography, sharp reflections, futuristic ecommerce banner, ultra realistic product photography, commercial tech advertising style, cinematic lighting`,
    gaming: `Epic gaming product campaign, dark dramatic studio, purple neon glow effects, ${productName} gaming aesthetic, dramatic shadows, premium gaming advertising, ultra realistic photography, cinematic composition, high-end gaming brand style`,
    furniture: `Warm interior lifestyle photography, natural wood tones, ${productName} home styling, soft ambient lighting, premium furniture catalog aesthetic, editorial interior design, ultra realistic lifestyle photo, luxury home advertising`,
    luxury: `Exclusive luxury brand campaign, black and gold aesthetic, ${productName} premium product photography, dramatic studio lighting, high-end jewelry and luxury goods advertising, ultra realistic commercial photography, editorial luxury style`,
    default: `Premium ecommerce product campaign, ${productName} commercial photography, professional studio lighting, clean background, high-end advertising aesthetic, ultra realistic product photography, editorial composition, luxury brand style`,
  }

  const purposeModifiers: Record<string, string> = {
    black_friday: 'dramatic bold composition, high contrast lighting, urgency and excitement',
    discount: 'vibrant energetic composition, promotional advertising style',
    vip: 'exclusive luxury aesthetic, premium quality, sophisticated',
    product_launch: 'exciting new product reveal, dramatic unveiling composition',
    win_back: 'warm nostalgic aesthetic, emotional reconnection',
  }

  let base = categoryPrompts[category] ?? categoryPrompts[layoutStyle] ?? categoryPrompts.default
  if (purposeModifiers[purpose]) base += `, ${purposeModifiers[purpose]}`

  return base
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const {
    purpose,
    name,
    productDescription,
    products = [],
    discountRate,
    brandTone,
    ctaPurpose,
    layoutStyle,
    storeName,
    primaryColor,
  } = await req.json()

  if (!purpose) {
    return NextResponse.json({ error: 'purpose zorunlu' }, { status: 400 })
  }

  const purposeLabel = PURPOSE_LABELS[purpose] ?? purpose
  const discount = discountRate ? `%${discountRate} indirim` : 'indirim yok'
  const ctaHint = ctaPurpose ? `CTA amacı: ${ctaPurpose}` : ''
  const productContext = buildProductContext(products)
  const suggestedTheme = detectThemeFromProducts(products, layoutStyle)
  const hasProducts = products.length > 0

  const prompt = `Sen dünyaca ünlü bir e-ticaret pazarlama uzmanı ve metin yazarısın. Verilen bilgilere göre yüksek dönüşümlü, kişiselleştirilmiş bir e-posta kampanyası üret.

Kampanya Amacı: ${purposeLabel}
Kampanya Adı: ${name || 'Belirtilmemiş'}
${hasProducts ? productContext : `Ürün/Hizmet: ${productDescription || 'Belirtilmemiş'}`}
İndirim: ${discount}
Marka Tonu: ${brandTone || 'Profesyonel ve Güvenilir'}
Marka: ${storeName || 'Marka'}
Önerilen Tema: ${suggestedTheme}
${ctaHint}

Kurallar:
- Türkçe içerik üret (görsel prompt hariç, o İngilizce olacak).
- Spam tetikleyici kelimeler kullanma (ÜCRETSİZ, HEMEN, %100 gibi).
- Mail konusu max 55 karakter, emoji kullanabilirsin.
- Preview text konuyu tamamlasın, merak uyandırsın (max 90 karakter).
- Headline güçlü, duygusal bağ kursun, ürün odaklı olsun.
- Body 2-3 kısa paragraf. {{firstName}} ile başla. Ürünleri doğal şekilde söz et.
- CTA net ve aksiyon odaklı. Ürün kategorisine göre:
  Fashion → "Koleksiyonu Keşfet" | Tech → "Şimdi İncele" | Skincare → "Rutinini Yenile" | Gaming → "Hemen Al"
- imagePrompt: İngilizce, photorealistic commercial photography, ultra realistic, not AI looking.
- layoutStyle: ürün kategorisine göre en uygununu seç: luxury|minimal|black-friday|skincare|fashion|tech|furniture|gaming
- personalizationVariables: kullandığın değişkenleri listele.

SADECE aşağıdaki JSON formatında dön:
{
  "subject": "",
  "previewText": "",
  "headline": "",
  "body": "",
  "ctaText": "",
  "imagePrompt": "",
  "layoutStyle": "${suggestedTheme}",
  "brandTone": "",
  "recommendedSegment": "${SEGMENT_MAP[purpose] ?? 'all'}",
  "personalizationVariables": ["{{firstName}}"],
  "smsVariant": "",
  "whatsappVariant": "",
  "visualDirection": ""
}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.72,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const result = JSON.parse(raw)

    // Fallbacks
    if (!result.recommendedSegment) result.recommendedSegment = SEGMENT_MAP[purpose] ?? 'all'
    if (!result.personalizationVariables) result.personalizationVariables = ['{{firstName}}']
    if (!result.layoutStyle) result.layoutStyle = suggestedTheme

    // Override imagePrompt with our premium version if products are provided
    if (hasProducts && (!result.imagePrompt || result.imagePrompt.length < 50)) {
      result.imagePrompt = buildVisualPrompt(products, purpose, suggestedTheme)
    } else if (!result.imagePrompt) {
      result.imagePrompt = buildVisualPrompt(products, purpose, suggestedTheme)
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[AI Generate Campaign]', err)
    return NextResponse.json({ error: 'İçerik üretilemedi' }, { status: 500 })
  }
}
