import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'
import fs from 'fs'
import path from 'path'
import { detectCategory } from '@/lib/product-shots'
import { buildBannerHeroPrompt, BANNER_HERO_STYLES, type BannerStyleId } from '@/lib/banner-hero'

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY })

// ─── Upload helpers ───────────────────────────────────────────────────────────

async function uploadDataUrl(dataUrl: string): Promise<string> {
  const [meta, b64] = dataUrl.split(',')
  if (!b64) return dataUrl
  const mime = meta.split(':')[1]?.split(';')[0] ?? 'image/jpeg'
  const ext  = mime.split('/')[1] ?? 'jpg'
  const buf  = Buffer.from(b64, 'base64')
  return fal.storage.upload(new File([new Blob([buf], { type: mime })], `product.${ext}`, { type: mime }))
}

async function uploadLocalFile(filePath: string): Promise<string> {
  const buf  = fs.readFileSync(filePath)
  const file = new File([new Blob([buf], { type: 'image/jpeg' })], path.basename(filePath), { type: 'image/jpeg' })
  return fal.storage.upload(file)
}

// ─── Generation with style reference ─────────────────────────────────────────

type AR = '16:9' | '3:4' | '1:1'

async function generate(
  productUrl: string,
  styleUrl: string,
  prompt: string,
  aspectRatio: AR,
): Promise<string> {

  // ── 1st try: kontext-max with BOTH images (product + style reference) ────────
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext-max', {
      input: {
        image_url:           [productUrl, styleUrl],
        prompt,
        num_images:          1,
        guidance_scale:      3.5,
        num_inference_steps: 30,
        aspect_ratio:        aspectRatio,
        output_format:       'jpeg',
        safety_tolerance:    '2',
      } as Record<string, unknown>,
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const url = (result.data ?? result)?.images?.[0]?.url
    if (url) return url
    throw new Error('no url')
  } catch (e) {
    console.warn('[banner-hero] kontext-max multi-image failed:', (e as Error).message)
  }

  // ── 2nd try: kontext with style image as base — preserves scene ─────────────
  // Scene is the input image. Product is described in the prompt.
  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
      input: {
        image_url:           styleUrl,
        prompt:              prompt + ' The background, lighting, environment and composition of this scene must remain exactly as shown.',
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
    throw new Error('no url')
  } catch (e) {
    console.warn('[banner-hero] kontext scene-first failed:', (e as Error).message)
  }

  // ── 3rd try: kontext with product image — product preserved ─────────────────
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
    throw new Error('no url')
  } catch (e) {
    console.warn('[banner-hero] kontext product-first failed:', (e as Error).message)
  }

  // ── Last resort: img2img ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (fal.subscribe as any)('fal-ai/flux/dev/image-to-image', {
    input: {
      image_url:           productUrl,
      prompt,
      strength:            0.68,
      num_inference_steps: 28,
      guidance_scale:      4.0,
      num_images:          1,
    },
  }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

  const url = (result.data ?? result)?.images?.[0]?.url
  if (!url) throw new Error('All generation methods failed')
  return url
}

// ─── POST ─────────────────────────────────────────────────────────────────────

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

  if (!productImageUrl) return NextResponse.json({ error: 'Ürün görseli gerekli.' }, { status: 400 })
  if (!backgroundStyle) return NextResponse.json({ error: 'Banner stili gerekli.' }, { status: 400 })

  const styleDef = BANNER_HERO_STYLES.find(s => s.id === backgroundStyle)
  if (!styleDef) return NextResponse.json({ error: 'Geçersiz banner stili.' }, { status: 400 })

  const category = detectCategory(productName)
  console.log(`[banner-hero] style:${backgroundStyle} cat:${category} product:${productName}`)

  // Upload product image (data URL → Fal storage)
  let productUrl = productImageUrl
  if (productUrl.startsWith('data:')) {
    try {
      productUrl = await uploadDataUrl(productUrl)
      console.log('[banner-hero] product uploaded:', productUrl.slice(0, 60))
    } catch (e) {
      return NextResponse.json({ error: 'Ürün görseli yüklenemedi.' }, { status: 500 })
    }
  }

  // Upload style reference image from local filesystem → Fal storage
  const styleFilePath = path.join(process.cwd(), 'public', 'templates', styleDef.imageFile)
  let styleUrl: string
  try {
    styleUrl = await uploadLocalFile(styleFilePath)
    console.log('[banner-hero] style uploaded:', styleUrl.slice(0, 60))
  } catch (e) {
    console.error('[banner-hero] style upload failed:', (e as Error).message)
    // Fall back to just product URL approach
    styleUrl = productUrl
  }

  // Build prompts for each size
  const desktopPrompt = buildBannerHeroPrompt(backgroundStyle, category, productName, brandName, '16:9')
  const mobilePrompt  = buildBannerHeroPrompt(backgroundStyle, category, productName, brandName, '3:4')

  // Generate desktop + mobile concurrently
  const [desktopResult, mobileResult] = await Promise.allSettled([
    generate(productUrl, styleUrl, desktopPrompt, '16:9'),
    generate(productUrl, styleUrl, mobilePrompt,  '3:4'),
  ])

  const desktop = desktopResult.status === 'fulfilled' ? desktopResult.value : null
  const mobile  = mobileResult.status  === 'fulfilled' ? mobileResult.value  : null

  if (!desktop && !mobile) {
    return NextResponse.json({ error: 'Banner oluşturulamadı. Lütfen tekrar deneyin.' }, { status: 500 })
  }

  return NextResponse.json({ desktop, mobile, category, backgroundStyle })
}
