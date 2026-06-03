import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface CampaignRow {
  name: string
  type: string
  status: string
  opened: number
  sent: number
}

// Suggestions always link to relevant pages within the app
const HREF_MAP: Record<string, string> = {
  mail:         '/ai-studio',
  zap:          '/automations',
  users:        '/segments',
  trending_up:  '/analytics',
  target:       '/campaigns/new',
  clock:        '/campaigns/new',
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { campaigns = [], openRate = 0, clickRate = 0, totalRevenue = 0, totalSent = 0 } = await req.json()

  const recentLines = (campaigns as CampaignRow[])
    .slice(0, 6)
    .map(c => `- "${c.name}" (${c.type === 'email' ? 'e-posta' : 'WhatsApp'}, ${c.status}) açılma %${c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : 0}`)
    .join('\n') || '- Kampanya yok'

  const prompt = `Sen bir e-ticaret büyüme uzmanısın. Mağaza kampanya verilerini analiz et, 3 farklı kategoride spesifik, uygulanabilir öneri üret. Öneriler Türkçe, veriye dayalı ve somut olsun.

Kampanya Metrikleri:
- Açılma oranı: %${openRate}
- Tıklama oranı: %${clickRate}
- Toplam gelir: ${Number(totalRevenue).toLocaleString('tr')} ₺
- Gönderilen: ${Number(totalSent).toLocaleString('tr')} mesaj
- Kampanya sayısı: ${(campaigns as CampaignRow[]).length}

Son Kampanyalar:
${recentLines}

Kural: 3 öneri farklı kategoride olsun (e-posta içeriği, segment/hedefleme, otomasyon/zamanlama gibi). Rakamları kullan.
icon kuralı: mail=e-posta/içerik, zap=otomasyon, users=segment, trending_up=analitik, target=kampanya, clock=zamanlama

Renk: turuncu=#f0a020, yeşil=#22c97a, mavi=#99b4ff, mor=#9f7afa

JSON olarak dön:
{
  "suggestions": [
    {
      "title": "Kısa başlık (max 4 kelime)",
      "text": "Veriye dayalı, spesifik açıklama, rakam içersin (max 115 karakter)",
      "action": "CTA butonu metni (max 3 kelime)",
      "color": "#hex",
      "icon": "mail|zap|users|trending_up|target|clock"
    }
  ]
}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.55,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []

    const enriched = suggestions.slice(0, 3).map((s: { icon?: string; [key: string]: unknown }) => ({
      ...s,
      href: HREF_MAP[s.icon ?? ''] ?? '/campaigns/new',
    }))

    return NextResponse.json(enriched)
  } catch (err) {
    console.error('[AI Campaign Suggestions]', err)
    return NextResponse.json([], { status: 500 })
  }
}
