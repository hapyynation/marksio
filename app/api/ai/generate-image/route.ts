import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { fal } from '@fal-ai/client'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { prompt, style = 'photorealistic', width = 1024, height = 576 } = await req.json()

  if (!prompt) return NextResponse.json({ error: 'prompt zorunlu' }, { status: 400 })

  try {
    const enhancedPrompt = `Professional e-commerce marketing email hero image. ${prompt}. High quality, commercial photography style, clean background, ${style}, suitable for email marketing, turkish brand`

    const result = await fal.subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: enhancedPrompt,
        image_size: { width, height },
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true,
      },
    }) as { data?: { images?: Array<{ url: string }> }; images?: Array<{ url: string }> }

    const imageUrl = result?.data?.images?.[0]?.url ?? (result as { images?: Array<{ url: string }> })?.images?.[0]?.url
    if (!imageUrl) throw new Error('Görsel üretilemedi')

    return NextResponse.json({ url: imageUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Görsel üretilemedi'
    console.error('[fal.ai]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
