import { fal } from '@fal-ai/client'

export async function POST(req: Request) {
  if (!process.env.FAL_KEY) {
    return Response.json({ error: 'Bu özelliği kullanmak için Fal AI API anahtarı gerekli.', success: false }, { status: 503 })
  }

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return Response.json({ error: 'imageUrl required' }, { status: 400 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(fal as any).config({ credentials: process.env.FAL_KEY })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (fal as any).subscribe('fal-ai/imageutils/rembg', {
      input: { image_url: imageUrl },
    })

    return Response.json({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      url: (result as any).data?.image?.url ?? (result as any).data?.image_url,
      success: true,
    })
  } catch (err) {
    console.error('Remove bg error:', err)
    return Response.json({ error: 'Background removal failed', success: false }, { status: 500 })
  }
}
