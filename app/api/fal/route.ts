import { NextRequest, NextResponse } from 'next/server'
import { fal } from '@fal-ai/client'

if (process.env.FAL_KEY) fal.config({ credentials: process.env.FAL_KEY })

type FalResult = { data?: { images?: Array<{ url: string }>; image?: { url: string } }; images?: Array<{ url: string }> }

function extractUrl(result: FalResult): string | null {
  return (result.data ?? result)?.images?.[0]?.url
    ?? result.data?.image?.url
    ?? null
}

export async function POST(req: NextRequest) {
  if (!process.env.FAL_KEY) {
    return NextResponse.json({ error: 'FAL_KEY eksik.' }, { status: 503 })
  }

  try {
    const body = await req.json() as {
      action: 'remove-bg' | 'generate-banner'
      imageUrl?: string
      prompt?: string
      style?: string
      productImageUrl?: string
      config?: { brandName: string; productName: string; accentColor: string }
    }
    const { action } = body

    if (action === 'remove-bg') {
      const { imageUrl } = body
      if (!imageUrl) return NextResponse.json({ error: 'imageUrl gerekli' }, { status: 400 })

      const result = await fal.subscribe('fal-ai/birefnet', {
        input: { image_url: imageUrl },
      }) as FalResult

      const url = extractUrl(result) ?? (result.data as Record<string, unknown>)?.image_url as string | undefined
      if (!url) throw new Error('Arka plan kaldırma başarısız')

      return NextResponse.json({ url })
    }

    if (action === 'generate-banner') {
      const { prompt = '', style = 'minimal', productImageUrl, config } = body

      let productUrl = productImageUrl ?? null

      if (productUrl?.startsWith('data:')) {
        const [meta, b64] = productUrl.split(',')
        const mime = meta?.split(':')[1]?.split(';')[0] ?? 'image/jpeg'
        const ext = mime.split('/')[1] ?? 'jpg'
        const buf = Buffer.from(b64, 'base64')
        productUrl = await fal.storage.upload(
          new File([new Blob([buf], { type: mime })], `product.${ext}`, { type: mime })
        )
      }

      const styleModifiers: Record<string, string> = {
        minimal: 'clean minimalist white background, soft shadows, editorial',
        dramatic: 'dramatic moody lighting, dark premium background, cinematic',
        colorful: 'vibrant colorful background, energetic, bold colors',
        corporate: 'professional studio lighting, clean corporate background, high-end',
      }
      const styleHint = styleModifiers[style] ?? styleModifiers.minimal
      const brandHint = config?.brandName ? `for ${config.brandName} brand` : ''
      const productHint = config?.productName ? `featuring ${config.productName}` : ''
      const fullPrompt = `${prompt || 'Professional e-commerce product banner'} ${productHint} ${brandHint}. ${styleHint}. High quality commercial photography, turkish e-commerce market.`

      if (productUrl) {
        try {
          const result = await fal.subscribe('fal-ai/flux-pro/v1/kontext', {
            input: {
              image_url: productUrl,
              prompt: fullPrompt,
              num_images: 1,
              guidance_scale: 4.5,
              num_inference_steps: 28,
              aspect_ratio: '16:9',
              output_format: 'jpeg',
              safety_tolerance: '2',
            } as Record<string, unknown>,
          }) as FalResult

          const url = extractUrl(result)
          if (url) return NextResponse.json({ url })
        } catch (e) {
          console.warn('[fal/generate-banner] kontext failed:', (e as Error).message)
        }
      }

      const fallback = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: fullPrompt,
          image_size: { width: 1200, height: 675 },
          num_inference_steps: 4,
          num_images: 1,
        },
      }) as FalResult

      const fallbackUrl = extractUrl(fallback)
      if (!fallbackUrl) throw new Error('Banner üretilemedi')

      return NextResponse.json({ url: fallbackUrl })
    }

    return NextResponse.json({ error: 'Geçersiz action' }, { status: 400 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('[fal]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
