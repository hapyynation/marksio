import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface CampaignRow {
  name: string
  type: string
  status: string
  opened: number
  clicked: number
  sent: number
  revenue: number
}

const HREF_MAP: Record<string, string> = {
  mail:        '/ai-studio',
  zap:         '/automations',
  users:       '/segments',
  trending_up: '/analytics',
  target:      '/ai-studio',
  clock:       '/ai-studio',
}

// Server-side computed fallback — no Groq needed
function buildFallback(
  campaigns: CampaignRow[],
  openRate: number,
  clickRate: number,
  totalRevenue: number,
  totalSent: number,
) {
  const suggestions = []

  // 1. Open-rate suggestion
  if (Number(openRate) < 35) {
    suggestions.push({
      title: 'Açılma Oranını Artır',
      text: `Açılma oranınız %${openRate} — sektör ortalaması %38'in altında. Konu satırını AI ile kişiselleştirin.`,
      action: 'AI Stüdyo',
      color: '#f0a020',
      icon: 'mail',
      href: '/ai-studio',
    })
  } else {
    suggestions.push({
      title: 'Konu Satırı Testi',
      text: `Açılma oranınız %${openRate} — A/B testi ile %${Math.round(Number(openRate) * 1.15)} hedefleyin.`,
      action: 'AI Stüdyo',
      color: '#f0a020',
      icon: 'mail',
      href: '/ai-studio',
    })
  }

  // 2. Segment/revenue suggestion
  const completedRevenue = campaigns.filter(c => c.status === 'completed').reduce((s, c) => s + c.revenue, 0)
  if (completedRevenue > 0) {
    suggestions.push({
      title: 'VIP Segment Oluştur',
      text: `Gelirinizin büyük kısmı tamamlanan ${campaigns.filter(c => c.status === 'completed').length} kampanyadan geliyor. VIP müşteri segmenti oluşturun.`,
      action: 'Segment Oluştur',
      color: '#99b4ff',
      icon: 'users',
      href: '/segments',
    })
  } else {
    suggestions.push({
      title: 'Hedef Kitle Yönetimi',
      text: `${campaigns.length} kampanyanız var. Segmentlere göre kişiselleştirilmiş kampanyalar %23 daha yüksek dönüşüm sağlar.`,
      action: 'Segment Oluştur',
      color: '#99b4ff',
      icon: 'users',
      href: '/segments',
    })
  }

  // 3. Automation suggestion
  const hasActive = campaigns.some(c => c.status === 'active')
  suggestions.push({
    title: 'Sepet Kurtarma',
    text: hasActive
      ? `Aktif kampanyanız var. Sepeti terk edenleri otomatik yakalayan bir akış ekleyin — ortalama %15 kurtarma oranı.`
      : `Sepeti terk edenleri otomatik yakalayan otomasyon kurun. Ortalama %15 kurtarma oranı sağlar.`,
    action: 'Otomasyon Kur',
    color: '#22c97a',
    icon: 'zap',
    href: '/automations',
  })

  return suggestions
}

export async function POST(req: NextRequest) {
  const { campaigns = [], openRate = 0, clickRate = 0, totalRevenue = 0, totalSent = 0 } = await req.json()

  const recentLines = (campaigns as CampaignRow[])
    .slice(0, 6)
    .map(c =>
      `- "${c.name}" (${c.type === 'email' ? 'e-posta' : 'WhatsApp'}, ${c.status}) açılma %${
        c.sent > 0 ? ((c.opened / c.sent) * 100).toFixed(1) : 0
      }, tıklama %${c.sent > 0 ? ((c.clicked / c.sent) * 100).toFixed(1) : 0}, gelir ${c.revenue?.toLocaleString('tr')} ₺`,
    )
    .join('\n') || '- Kampanya verisi yok'

  const prompt = `Sen Türkiye'nin önde gelen e-ticaret pazarlama uzmanısın. Aşağıdaki kampanya verilerini analiz et ve 3 farklı kategoride veriye dayalı, spesifik, uygulanabilir öneri üret.

Performans Özeti:
- Ortalama açılma oranı: %${openRate}
- Tıklama oranı: %${clickRate}
- Toplam gelir: ${Number(totalRevenue).toLocaleString('tr')} ₺
- Gönderilen mesaj: ${Number(totalSent).toLocaleString('tr')}
- Kampanya sayısı: ${(campaigns as CampaignRow[]).length}

Son Kampanyalar:
${recentLines}

Kurallar:
- Her öneri farklı kategoride olsun: 1 adet içerik/konu, 1 adet segment/hedef kitle, 1 adet otomasyon/zamanlama
- Gerçek rakamları kullan (açılma oranı, gelir gibi)
- Öneriler somut ve uygulanabilir olsun
- icon seç: mail=içerik/konu, users=segment, zap=otomasyon, trending_up=analitik, target=kampanya, clock=zamanlama
- color: mail için #f0a020, users için #99b4ff, zap için #22c97a, trending_up için #9f7afa, target için #99b4ff

JSON:
{
  "suggestions": [
    {
      "title": "Max 4 kelime",
      "text": "Veriye dayalı açıklama, rakam içersin, max 120 karakter",
      "action": "CTA (max 3 kelime)",
      "color": "#hex",
      "icon": "mail|zap|users|trending_up|target|clock"
    }
  ]
}`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []

    if (suggestions.length === 0) throw new Error('empty')

    const enriched = suggestions.slice(0, 3).map((s: { icon?: string; [key: string]: unknown }) => ({
      ...s,
      href: HREF_MAP[s.icon ?? ''] ?? '/ai-studio',
    }))

    return NextResponse.json(enriched)
  } catch {
    // Groq failed or returned empty → serve computed fallback
    const fallback = buildFallback(
      campaigns as CampaignRow[],
      Number(openRate),
      Number(clickRate),
      Number(totalRevenue),
      Number(totalSent),
    )
    return NextResponse.json(fallback)
  }
}
