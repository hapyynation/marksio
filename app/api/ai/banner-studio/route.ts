import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { fal } from '@fal-ai/client'
import {
  detectCategory, buildCommercialPrompt, getAutoStyle,
  type ProductCategory, type ShotStyle,
} from '@/lib/product-shots'

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY })
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// ─── Upload product image to Fal storage ──────────────────────────────────────

async function uploadToFal(dataUrl: string): Promise<string> {
  const [meta, b64] = dataUrl.split(',')
  if (!b64) return dataUrl
  const mime = meta.split(':')[1]?.split(';')[0] ?? 'image/jpeg'
  const ext  = mime.split('/')[1] ?? 'jpg'
  const buf  = Buffer.from(b64, 'base64')
  return fal.storage.upload(new File([new Blob([buf], { type: mime })], `product.${ext}`, { type: mime }))
}

// ─── Commercial shot: product preserved and naturally placed in premium scene ─

async function generateCommercialShot(params: {
  productUrl: string
  prompt: string
  aspectRatio: '16:9' | '1:1' | '3:4'
}): Promise<string> {
  const { productUrl, prompt, aspectRatio } = params

  // Primary: flux-pro/v1/kontext — edits image to place product in premium scene
  // while preserving every detail of the original product
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
      input: {
        image_url:            productUrl,
        prompt,
        num_images:           1,
        guidance_scale:       4.5,
        num_inference_steps:  28,
        aspect_ratio:         aspectRatio,
        output_format:        'jpeg',
        safety_tolerance:     '2',
      } as Record<string, unknown>,
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const url = (result.data ?? result)?.images?.[0]?.url
    if (url) return url
    throw new Error('kontext: no URL')
  } catch (e) {
    console.warn('[banner] kontext failed:', (e as Error).message)
  }

  // Fallback: bria/product-shot — product placement with clean background
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)('fal-ai/bria/product-shot', {
      input: {
        image_url:           productUrl,
        scene_description:   prompt.slice(0, 300),
        product_description: 'preserve product exactly as shown',
        num_results:         1,
        optimize_description: false,
      },
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const url = (result.data ?? result)?.images?.[0]?.url
    if (url) return url
    throw new Error('bria: no URL')
  } catch (e) {
    console.warn('[banner] bria failed:', (e as Error).message)
  }

  // Fallback: flux/dev img2img — style transfer keeping product visible
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal.subscribe as any)('fal-ai/flux/dev/image-to-image', {
      input: {
        image_url:            productUrl,
        prompt,
        strength:             0.68,
        num_inference_steps:  28,
        guidance_scale:       4.0,
        num_images:           1,
      },
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const url = (result.data ?? result)?.images?.[0]?.url
    if (url) return url
    throw new Error('flux/dev: no URL')
  } catch (e) {
    console.warn('[banner] flux/dev failed:', (e as Error).message)
  }

  // Last resort: text-to-image (product not preserved but at least something generates)
  const r = await fal.subscribe('fal-ai/flux/schnell', {
    input: {
      prompt,
      image_size: aspectRatio === '16:9'
        ? { width: 1200, height: 675 }
        : aspectRatio === '1:1'
          ? { width: 800,  height: 800 }
          : { width: 600,  height: 800 },
      num_inference_steps: 4,
      num_images: 1,
    },
  }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }
  const url = (r.data ?? r)?.images?.[0]?.url
  if (!url) throw new Error('All generation methods failed')
  return url
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const tag = '[banner-studio]'
  if (!process.env.FAL_KEY) return NextResponse.json({ error: 'FAL_KEY eksik.' }, { status: 500 })

  const body = await req.json() as {
    brandName: string
    productName: string
    campaignType: string
    discountRate: string
    discountType: string
    ctaText: string
    style: string
    accentColor: string
    size?: string
    productSource: string
    productImageUrl: string | null
    shotStyle?: ShotStyle
  }

  const {
    brandName, productName, campaignType,
    discountRate, discountType, ctaText,
    productSource, productImageUrl,
    shotStyle = 'auto',
  } = body

  if (!brandName?.trim()) return NextResponse.json({ error: 'Marka adı zorunludur.' }, { status: 400 })
  if (!productSource)      return NextResponse.json({ error: 'Ürün kaynağı gerekli.' }, { status: 400 })

  const discStr = discountRate
    ? discountType === 'percent' ? `%${discountRate}` : `${discountRate}₺`
    : ''

  const category: ProductCategory = detectCategory(productName || '')
  const effectiveStyle: ShotStyle  = shotStyle === 'auto' ? getAutoStyle(category) : shotStyle
  console.log(`${tag} cat:${category} style:${body.style} shot:${effectiveStyle}`)

  // ─── AI copy ────────────────────────────────────────────────────────────────
  let copy = {
    headline:      productName ? `${productName.slice(0, 22).toUpperCase()} İNDİRİMİ!` : 'BÜYÜK İNDİRİM!',
    subheadline:   'Seçili ürünlerde sepette anında',
    badge:         (brandName || productName || 'YENİ').toUpperCase().slice(0, 20),
    discountLabel: discStr ? `${discStr} İNDİRİM` : 'ÖZEL FİYATLAR',
    ctaLabel:      (ctaText || 'Alışverişe Başla').toUpperCase().slice(0, 22),
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const r = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'E-ticaret copywriter. Kısa, etkili, Türkçe. Sadece JSON. headline≤38, subheadline≤55, badge≤20, discountLabel≤18, ctaLabel≤22 karakter.' },
          { role: 'user',   content: `Marka:${brandName} Ürün:${productName||'ürün'} Kampanya:${campaignType} İndirim:${discStr||'yok'} CTA:${ctaText||'Alışverişe Başla'}\n{"headline":"...","subheadline":"...","badge":"...","discountLabel":"...","ctaLabel":"..."}` },
        ],
        temperature: 0.8, max_tokens: 200,
        response_format: { type: 'json_object' },
      })
      const p = JSON.parse(r.choices[0].message.content || '{}') as typeof copy
      if (p.headline) copy = {
        headline:      String(p.headline).slice(0, 38),
        subheadline:   String(p.subheadline).slice(0, 55),
        badge:         String(p.badge).slice(0, 20),
        discountLabel: String(p.discountLabel).slice(0, 18),
        ctaLabel:      String(p.ctaLabel).slice(0, 22),
      }
    } catch (e) { console.error(`${tag} Groq:`, (e as Error).message) }
  }

  // ─── Upload product image ───────────────────────────────────────────────────
  let productUrl = productImageUrl
  if (productUrl?.startsWith('data:')) {
    try {
      productUrl = await uploadToFal(productUrl)
      console.log(`${tag} Uploaded: ${productUrl.slice(0, 60)}`)
    } catch (e) {
      console.error(`${tag} Upload failed:`, (e as Error).message)
      productUrl = null
    }
  }

  // ─── No product image → text-to-image fallback ─────────────────────────────
  if (!productUrl) {
    const prompt = buildCommercialPrompt(category, effectiveStyle, productName || 'product', brandName || 'brand')
    try {
      const r = await fal.subscribe('fal-ai/flux/schnell', {
        input: { prompt, image_size: { width: 1200, height: 675 }, num_inference_steps: 4, num_images: 1 },
      }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }
      const url = (r.data ?? r)?.images?.[0]?.url
      if (!url) return NextResponse.json({ error: 'Görsel üretilemedi.' }, { status: 500 })
      return NextResponse.json({ content: copy, desktop: { url }, mobile: { url }, category, effectiveStyle })
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 })
    }
  }

  // ─── Generate commercial shots (product preserved, placed in premium scene) ─
  const desktopPrompt = buildCommercialPrompt(category, effectiveStyle, productName || 'product', brandName || 'brand', 'landscape')
  const mobilePrompt  = buildCommercialPrompt(category, effectiveStyle, productName || 'product', brandName || 'brand', 'square')

  console.log(`${tag} Generating desktop (16:9) + mobile (1:1) commercial shots...`)

  const [desktopResult, mobileResult] = await Promise.allSettled([
    generateCommercialShot({ productUrl, prompt: desktopPrompt, aspectRatio: '16:9' }),
    generateCommercialShot({ productUrl, prompt: mobilePrompt,  aspectRatio: '1:1'  }),
  ])

  const desktopUrl = desktopResult.status === 'fulfilled' ? desktopResult.value : null
  const mobileUrl  = mobileResult.status  === 'fulfilled' ? mobileResult.value  : null

  if (desktopResult.status === 'rejected') console.error(`${tag} Desktop:`, (desktopResult.reason as Error).message)
  if (mobileResult.status  === 'rejected') console.error(`${tag} Mobile:`,  (mobileResult.reason  as Error).message)

  if (!desktopUrl && !mobileUrl) {
    return NextResponse.json({ error: 'Ticari çekim üretilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }

  return NextResponse.json({
    content: copy,
    desktop: desktopUrl ? { url: desktopUrl } : null,
    mobile:  mobileUrl  ? { url: mobileUrl  } : null,
    category,
    effectiveStyle,
  })
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to generate commercial shots' })
}
