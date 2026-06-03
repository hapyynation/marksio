import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'API anahtarı gerekli.', success: false }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { productName, productDescription, goal, audience, discount, brandColor, ctaText, style, prompt } = await req.json()

    const styleVoices: Record<string, string> = {
      skincare:    'Clean beauty brand: warm, trustworthy, benefits-focused. Emphasize natural ingredients, skin transformation, self-care ritual.',
      furniture:   'Premium furniture brand: sophisticated, design-focused, lifestyle aspirational. Evoke spaces, craftsmanship, timelessness.',
      apple:       'Apple product launch: precise, minimal, powerful. Short declarative sentences. Focus on experience and innovation.',
      fashion:     'Fashion editorial: evocative, bold, sensory. Magazine energy. Use strong verbs and visual language.',
      blackfriday: 'Black Friday luxury: urgent yet premium. High-value positioning. Emphasize exclusivity and savings.',
      ecommerce:   'Modern ecommerce: clear, benefit-driven, conversion-focused. Trust-building language.',
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      system: `You are a world-class email copywriter for premium ecommerce brands.
Voice: ${styleVoices[style] ?? styleVoices.ecommerce}
Return ONLY valid JSON. No markdown, no explanation.`,
      messages: [{
        role: 'user',
        content: `Write premium email campaign content for:
Product: ${productName}
Description: ${productDescription || 'Premium product'}
Goal: ${goal || 'Drive sales'}
Audience: ${audience || 'Premium customers'}
Discount: ${discount || 'None'}
CTA: ${ctaText || 'Shop Now'}
Extra: ${prompt || 'None'}

Return this exact JSON structure:
{
  "subject": "email subject line (max 52 chars, compelling)",
  "eyebrow": "2-4 word uppercase label (e.g. NEW ARRIVAL, LIMITED EDITION)",
  "headline": "powerful main headline (5-10 words, no period)",
  "subheadline": "1-2 compelling sentences supporting the headline",
  "bodyText": "2-3 sentence product description for hero section",
  "ctaText": "button text (2-4 words)",
  "features": [
    {"icon": "emoji", "title": "3-word title", "desc": "one sentence"},
    {"icon": "emoji", "title": "3-word title", "desc": "one sentence"},
    {"icon": "emoji", "title": "3-word title", "desc": "one sentence"}
  ],
  "gridProducts": [
    {"name": "product name", "price": "₺XXX", "tag": "2-word label"},
    {"name": "product name", "price": "₺XXX", "tag": "2-word label"},
    {"name": "product name", "price": "₺XXX", "tag": "2-word label"}
  ],
  "offerHeadline": "offer section headline (if discount, otherwise empty)",
  "offerSubtext": "offer details or urgency text",
  "footerTagline": "short brand philosophy (5-8 words)"
}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const content = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    return Response.json({ content, success: true })
  } catch (err) {
    console.error('Campaign generation error:', err)
    return Response.json({ error: 'İçerik üretimi başarısız.', success: false }, { status: 500 })
  }
}
