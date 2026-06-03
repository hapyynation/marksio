import { fal } from '@fal-ai/client'

const STYLE_PROMPTS: Record<string, string> = {
  studio:   'clean minimalist studio photography background, neutral, soft shadows',
  luxury:   'dark luxury marble texture, gold accents, premium feel, glossy surface',
  nature:   'beautiful bokeh outdoor lifestyle background, soft green, warm tones',
  abstract: 'abstract gradient art, flowing shapes, vibrant modern composition',
  gradient: 'smooth vibrant gradient background, modern, colorful, brand-ready',
  tech:     'futuristic dark tech environment, neon blue accents, circuit patterns',
  fashion:  'editorial fashion photography background, warm tones, soft light',
  minimal:  'pure white minimalist background, soft shadows, product photography',
}

export async function POST(req: Request) {
  if (!process.env.FAL_KEY) {
    return Response.json({ error: 'Bu özelliği kullanmak için Fal AI API anahtarı gerekli.', success: false }, { status: 503 })
  }

  try {
    const { prompt = '', style = 'studio' } = await req.json()

    const baseStyle = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.studio
    const fullPrompt = [baseStyle, prompt, 'high quality, 4k, e-commerce product background, photorealistic']
      .filter(Boolean).join(', ')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(fal as any).config({ credentials: process.env.FAL_KEY })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe('fal-ai/flux/schnell', {
      input: {
        prompt: fullPrompt,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
        num_images: 1,
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageUrl = (result as any).data?.images?.[0]?.url
    if (!imageUrl) return Response.json({ error: 'No image generated' }, { status: 500 })

    return Response.json({ url: imageUrl, success: true })
  } catch (err) {
    console.error('Generate bg error:', err)
    return Response.json({ error: 'Generation failed', success: false }, { status: 500 })
  }
}
