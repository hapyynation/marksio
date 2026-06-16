import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ detectedObjects: [], detectedText: null, suggestedPrompt: '' })
  }

  try {
    const { imageBase64 } = await req.json() as { imageBase64: string }
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 gerekli' }, { status: 400 })

    const result = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBase64 } } as never,
          {
            type: 'text',
            text: `Analyze this e-commerce product image. Respond with valid JSON only, no markdown fences:
{"detectedObjects":["nesne1","nesne2"],"detectedText":"görüntüdeki metin veya null","suggestedPrompt":"professional English photography background prompt for Fal.ai banner generation"}
Rules: detectedObjects in Turkish max 6 items; suggestedPrompt in English describing ideal background, lighting, and scene for an e-commerce banner.`,
          },
        ],
      }],
      max_tokens: 320,
      temperature: 0.2,
    })

    const raw = result.choices[0]?.message?.content ?? '{}'
    const json = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(json)

    return NextResponse.json({
      detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects.slice(0, 6) : [],
      detectedText: (parsed.detectedText && parsed.detectedText !== 'null') ? String(parsed.detectedText) : null,
      suggestedPrompt: typeof parsed.suggestedPrompt === 'string' ? parsed.suggestedPrompt : '',
    })
  } catch (err) {
    console.error('[image-analyze]', err)
    // Graceful degradation — analysis is optional
    return NextResponse.json({ detectedObjects: [], detectedText: null, suggestedPrompt: '' })
  }
}
