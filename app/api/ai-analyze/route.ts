import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  if (!process.env.GROK_API_KEY) {
    return NextResponse.json({ error: 'GROK_API_KEY eksik.' }, { status: 503 })
  }

  try {
    const { imageBase64 } = await req.json() as { imageBase64: string }
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 gerekli' }, { status: 400 })

    const prompt = `You are a product image analyzer for an e-commerce marketing platform.
Analyze this product image carefully and return ONLY a JSON object, no markdown, no explanation.

Rules:
- detectedObjects: identify the EXACT product type (e.g. "sneaker", "perfume bottle", "t-shirt", "watch") — be specific
- dominantColors: list 3-5 hex color codes from the image
- detectedText: any visible text/brand name in the image, null if none
- suggestedFalPrompt: write a Flux image generation prompt IN TURKISH for creating a professional e-commerce banner featuring this exact product. Include the product type, colors, and a clean studio background suggestion.

Return format (JSON only):
{
  "dominantColors": ["#1a1aff", "#ffffff"],
  "detectedObjects": ["blue and white Nike sneaker", "children's shoe"],
  "detectedText": "Nike",
  "suggestedFalPrompt": "Profesyonel e-ticaret stüdyo çekimi, mavi beyaz Nike spor ayakkabı, temiz beyaz arka plan, yumuşak gölge, yüksek kalite ürün fotoğrafı"
}`

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[ai-analyze] xAI error:', err)
      return NextResponse.json({ error: 'Görsel analiz edilemedi.' }, { status: 500 })
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    const rawText = data.choices?.[0]?.message?.content ?? ''
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('JSON parse failed')
    const parsed = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      dominantColors: Array.isArray(parsed.dominantColors) ? parsed.dominantColors.slice(0, 5) : [],
      detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects.slice(0, 6) : [],
      detectedText: parsed.detectedText && parsed.detectedText !== 'null' ? String(parsed.detectedText) : null,
      suggestedFalPrompt: typeof parsed.suggestedFalPrompt === 'string' ? parsed.suggestedFalPrompt : '',
    })
  } catch (err) {
    console.error('[ai-analyze]', err)
    return NextResponse.json({ error: 'Görsel analiz edilemedi.' }, { status: 500 })
  }
}
