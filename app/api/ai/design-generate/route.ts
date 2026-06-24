import { NextRequest } from 'next/server'
import { getApiSession } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const FAL_KEY = process.env.FAL_KEY!

async function generateWithFal(prompt: string): Promise<string> {
  const submitRes = await fetch('https://queue.fal.run/fal-ai/ideogram/v2', {
    method: 'POST',
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '16:9',
      style: 'DESIGN',
      magic_prompt_option: 'OFF',
    }),
  })

  if (!submitRes.ok) throw new Error(`fal.ai submit failed: ${await submitRes.text()}`)
  const { request_id } = await submitRes.json() as { request_id: string }

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const pollRes = await fetch(`https://queue.fal.run/fal-ai/ideogram/v2/requests/${request_id}`, {
      headers: { Authorization: `Key ${FAL_KEY}` },
    })
    if (!pollRes.ok) continue
    const result = await pollRes.json() as { status: string; images?: Array<{ url: string }> }
    if (result.status === 'COMPLETED' && result.images?.[0]) {
      return result.images[0].url
    }
    if (result.status === 'FAILED') throw new Error('fal.ai generation failed')
  }
  throw new Error('fal.ai generation timed out')
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { brief: rawBrief, history: rawHistory = [] } = await req.json() as {
    brief: string
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  if (!rawBrief?.trim()) return new Response('brief gerekli', { status: 400 })

  const brief = rawBrief.slice(0, 2000)
  const history = (rawHistory as Array<{ role: 'user' | 'assistant'; content: string }>)
    .slice(-10)
    .map(h => ({ role: (h.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant', content: String(h.content).slice(0, 4000) }))

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const send = (data: object) => writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))

  ;(async () => {
    try {
      await send({ type: 'status', message: 'Kampanya analiz ediliyor...' })

      const parseRes = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Sen bir email kampanyası görseli oluşturan AI tasarım asistanısın.

Kullanıcının kampanya brief'ini analiz et ve şu JSON'u döndür:
{
  "title": "Ana başlık (Türkçe, max 40 karakter)",
  "subtitle": "Alt başlık (Türkçe, max 80 karakter)",
  "cta_text": "Call-to-action butonu (Türkçe, max 20 karakter)",
  "discount_rate": "İndirim oranı varsa (örn: %30) yoksa boş",
  "brand_colors": "Uygun renkler (örn: koyu mavi ve altın sarısı)",
  "mood": "Tasarım tonu (örn: profesyonel, enerjik, minimalist, lüks)",
  "category": "indirim|urun_tanitim|sezonluk|hosgeldin|sepet",
  "fal_prompt": "İngilizce, detaylı fal.ai image generation prompt. Email marketing banner, 16:9, professional design. Şu unsurları içermeli: layout, colors, style, text placement, visual elements. NO FACES. Marka metinleri de İngilizce versiyonlarıyla prompt'a ekle."
}

Sadece JSON döndür.`,
        messages: [
          ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
          { role: 'user', content: brief },
        ],
      })

      let parsed: Record<string, string> = {}
      try {
        const text = parseRes.content[0].type === 'text' ? parseRes.content[0].text : '{}'
        parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}')
      } catch { /* ignore */ }

      const title = parsed.title ?? 'Özel Kampanya'
      const subtitle = parsed.subtitle ?? ''
      const ctaText = parsed.cta_text ?? 'Hemen Al'
      const falPrompt = parsed.fal_prompt ?? `Professional email marketing banner, modern minimalist design, ${brief}, dark background with accent colors, clean typography, 16:9 ratio`

      await send({ type: 'status', message: 'Tasarım konsepti oluşturuluyor...' })
      await send({ type: 'status', message: 'AI görsel üretiliyor...' })

      const imageUrl = await generateWithFal(falPrompt)

      await send({
        type: 'done',
        imageUrl,
        designId: `fal_${Date.now()}`,
        briefData: { title, subtitle, cta_text: ctaText, category: parsed.category ?? 'indirim' },
        source: 'fal',
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
      await send({ type: 'error', message: msg })
    } finally {
      await writer.close()
    }
  })()

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
