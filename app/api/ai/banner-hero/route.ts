import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import { detectCategory } from '@/lib/product-shots'
import { buildBannerHeroPrompt, type BannerStyleId } from '@/lib/banner-hero'

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY })

async function uploadToFal(dataUrl: string): Promise<string> {
  const [meta, b64] = dataUrl.split(',')
  if (!b64) return dataUrl
  const mime = meta.split(':')[1]?.split(';')[0] ?? 'image/jpeg'
  const ext  = mime.split('/')[1] ?? 'jpg'
  const buf  = Buffer.from(b64, 'base64')
  return fal.storage.upload(new File([new Blob([buf], { type: mime })], `product.${ext}`, { type: mime }))
}

type AspectRatio = '16:9' | '3:4' | '1:1'

async function generateHero(
  productUrl: string,
  prompt: string,
  aspectRatio: AspectRatio,
): Promise<string> {
  // Primary: flux-pro/v1/kontext — preserves product identity
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
      input: {
        image_url:           productUrl,
        prompt,
        num_images:          1,
        guidance_scale:      4.5,
        num_inference_steps: 28,
        aspect_ratio:        aspectRatio,
        output_format:       'jpeg',
        safety_tolerance:    '2',
      } as Record<string, unknown>,
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const url = (result.data ?? result)?.images?.[0]?.url
    if (url) return url
    throw new Error('kontext: no url')
  } catch (e) {
    console.warn('[banner-hero] kontext failed:', (e as Error).message)
  }

  // Fallback: bria product-shot
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
    throw new Error('bria: no url')
  } catch (e) {
    console.warn('[banner-hero] bria failed:', (e as Error).message)
  }

  // Last fallback: img2img
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal.subscribe as any)('fal-ai/flux/dev/image-to-image', {
    input: {
      image_url:           productUrl,
      prompt,
      strength:            0.65,
      num_inference_steps: 28,
      guidance_scale:      4.0,
      num_images:          1,
    },
  }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

  const url = (result.data ?? result)?.images?.[0]?.url
  if (!url) throw new Error('All generation methods failed')
  return url
}

export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY eksik.' }, { status: 500 })
  }

  const body = await req.json() as {
    productImageUrl: string
    backgroundStyle: BannerStyleId
    productName?: string
    brandName?: string
  }

  const { productImageUrl, backgroundStyle, productName = '', brandName = '' } = body

  if (!productImageUrl) {
    return NextResponse.json({ error: 'Ürün görseli gerekli.' }, { status: 400 })
  }
  if (!backgroundStyle) {
    return NextResponse.json({ error: 'Banner stili gerekli.' }, { status: 400 })
  }

  const category = detectCategory(productName)

  // Upload data URL to Fal storage
  let productUrl = productImageUrl
  if (productUrl.startsWith('data:')) {
    try {
      productUrl = await uploadToFal(productUrl)
    } catch (e) {
      return NextResponse.json({ error: 'Görsel yüklenemedi.' }, { status: 500 })
    }
  }

  // Build prompts for 3 sizes
  const desktopPrompt = buildBannerHeroPrompt(backgroundStyle, category, productName, brandName, '16:9')
  const mobilePrompt  = buildBannerHeroPrompt(backgroundStyle, category, productName, brandName, '3:4')
  const squarePrompt  = buildBannerHeroPrompt(backgroundStyle, category, productName, brandName, '1:1')

  console.log(`[banner-hero] style:${backgroundStyle} cat:${category}`)

  // Generate all 3 sizes concurrently
  const [desktopResult, mobileResult, squareResult] = await Promise.allSettled([
    generateHero(productUrl, desktopPrompt, '16:9'),
    generateHero(productUrl, mobilePrompt,  '3:4'),
    generateHero(productUrl, squarePrompt,  '1:1'),
  ])

  const desktop = desktopResult.status === 'fulfilled' ? desktopResult.value : null
  const mobile  = mobileResult.status  === 'fulfilled' ? mobileResult.value  : null
  const square  = squareResult.status  === 'fulfilled' ? squareResult.value  : null

  if (!desktop && !mobile && !square) {
    return NextResponse.json({ error: 'Banner oluşturulamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }

  return NextResponse.json({ desktop, mobile, square, category, backgroundStyle })
}
