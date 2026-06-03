import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ actions: [], success: false, error: 'Bu özelliği kullanmak için API anahtarı gerekli.' }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { command, layers } = await req.json()

    const layerSummary = layers.map((l: { id: string; type: string; label: string; content?: string }) => ({
      id: l.id,
      type: l.type,
      label: l.label,
      content: l.content,
    }))

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: `Sen bir canvas tasarım editörü için Türkçe komutları yapılandırılmış JSON aksiyonlarına dönüştüren bir AI asistanısın.
Sadece geçerli JSON array döndür. Açıklama ekleme.

Kullanılabilir aksiyon tipleri:
- { "type": "updateText", "layerId": "<id>", "content": "<yeni metin>" }
- { "type": "updateStyle", "layerId": "<id>", "style": { "color"?, "fill"?, "fontSize"?, "fontWeight"?, "opacity"? } }
- { "type": "moveLayer", "layerId": "<id>", "x": <number>, "y": <number> }
- { "type": "addProductImage", "position": "left"|"right"|"center", "removeBackground": true|false }
- { "type": "generateBackground", "prompt": "<açıklama>" }
- { "type": "suggestPalette", "mood": "<ruh hali>" }`,
      messages: [{
        role: 'user',
        content: `Canvas katmanları:\n${JSON.stringify(layerSummary, null, 2)}\n\nKomut: "${command}"\n\nSadece JSON array döndür:`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '[]'
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    const actions = jsonMatch ? JSON.parse(jsonMatch[0]) : []

    return Response.json({ actions, success: true })
  } catch (err) {
    console.error('Editor command error:', err)
    return Response.json({ actions: [], success: false }, { status: 500 })
  }
}
