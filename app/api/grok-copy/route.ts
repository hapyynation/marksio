import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ headline: 'Özel Fırsat', ctaLabel: 'Hemen Al' })
  }

  try {
    const { analysis, config, style } = await req.json() as {
      analysis: { detectedObjects: string[]; detectedText: string | null; suggestedFalPrompt: string } | null
      config: { brandName: string; productName: string; accentColor: string }
      style: string
    }

    const objects = analysis?.detectedObjects?.join(', ') || 'ürün'
    const styleMap: Record<string, string> = {
      minimal: 'minimalist ve sade',
      dramatic: 'dramatik ve güçlü',
      colorful: 'renkli ve enerjik',
      corporate: 'kurumsal ve profesyonel',
    }
    const styleDesc = styleMap[style] ?? 'çekici'

    const r = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'E-ticaret kopya yazarı. Sadece JSON döndür. headline max 8 kelime, ctaLabel max 3 kelime.',
        },
        {
          role: 'user',
          content: `Marka: ${config.brandName || 'Marka'}\nÜrün/Kategori: ${config.productName || objects}\nStil: ${styleDesc}\n\nJSON: { "headline": "başlık", "ctaLabel": "CTA" }`,
        },
      ],
      max_tokens: 128,
      temperature: 0.75,
      response_format: { type: 'json_object' },
    })

    const parsed = JSON.parse(r.choices[0].message.content || '{}') as {
      headline?: string
      ctaLabel?: string
    }

    return NextResponse.json({
      headline: typeof parsed.headline === 'string' ? parsed.headline : 'Özel Fırsat',
      ctaLabel: typeof parsed.ctaLabel === 'string' ? parsed.ctaLabel : 'Hemen Al',
    })
  } catch (err) {
    console.error('[grok-copy]', err)
    return NextResponse.json({ headline: 'Özel Fırsat', ctaLabel: 'Hemen Al' })
  }
}
