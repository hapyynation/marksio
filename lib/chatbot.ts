import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface Order {
  orderNumber?: string | null
  status: string
  total: number
  placedAt: Date
}

interface Campaign {
  name: string
  type: string
  segment: string
}

interface BotSettings {
  tone: string
  responseLength: string
  emojiUsage: string
  fallbackMessage: string
  botName: string
}

interface KnowledgeSourceItem {
  sourceType: string
  content?: string | null
  url?: string | null
  fileName?: string | null
  title?: string | null
}

interface ChatbotParams {
  storeName: string
  customerName?: string | null
  customerOrders: Order[]
  activeCampaigns: Campaign[]
  currency: string
  userMessage: string
  botSettings?: BotSettings
  knowledgeSources?: KnowledgeSourceItem[]
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  short_professional: 'Kısa, profesyonel ve direkt yanıtlar ver. Gereksiz kelime kullanma.',
  friendly: 'Samimi ve yardımsever bir ton kullan. Müşteriyi rahatlatıcı bir şekilde yanıtla.',
  premium_sales: 'Premium bir satış asistanı gibi davran. Değer ve kaliteyi ön plana çıkar.',
  support_focused: 'Destek odaklı ol. Müşterinin sorununu anlamaya ve çözmeye odaklan.',
}

const EMOJI_INSTRUCTIONS: Record<string, string> = {
  none: 'Kesinlikle emoji kullanma.',
  low: 'Çok az emoji kullanabilirsin (maks 1).',
  normal: 'Gerektiğinde emoji kullanabilirsin.',
}

export async function buildChatbotReply(params: ChatbotParams): Promise<string> {
  const { storeName, customerName, customerOrders, activeCampaigns, currency, userMessage, botSettings, knowledgeSources } = params

  const tone = botSettings?.tone ?? 'friendly'
  const responseLength = botSettings?.responseLength ?? 'medium'
  const emojiUsage = botSettings?.emojiUsage ?? 'low'
  const botName = botSettings?.botName ?? storeName

  const maxSentences = responseLength === 'short' ? 2 : 4

  const customerSection = customerName
    ? `Müşteri adı: ${customerName}
Son siparişler:
${customerOrders.length
  ? customerOrders.map(o =>
      `- Sipariş #${o.orderNumber ?? '?'} | Durum: ${translateStatus(o.status)} | Tutar: ${o.total.toFixed(2)} ${currency} | Tarih: ${new Date(o.placedAt).toLocaleDateString('tr-TR')}`
    ).join('\n')
  : '  Henüz sipariş yok.'}`
    : 'Müşteri sistemde kayıtlı değil.'

  const campaignSection = activeCampaigns.length
    ? activeCampaigns.map(c => `- ${c.name} (${c.type})`).join('\n')
    : 'Aktif kampanya yok.'

  const sourcesWithContent = (knowledgeSources ?? []).filter(s => s.content?.trim())
  const knowledgeSection = sourcesWithContent.length
    ? '\n\nBİLGİ KAYNAKLARI (bu bilgileri kullanarak cevap ver):\n' +
      sourcesWithContent.map(s => {
        const label = s.sourceType === 'PDF' ? `PDF (${s.fileName ?? s.title})`
          : s.sourceType === 'WEBSITE_URL' ? `Web sitesi (${s.url ?? s.title})`
          : s.title ?? 'Bilgi'
        return `[${label}]\n${s.content!.trim().slice(0, 2000)}`
      }).join('\n\n')
    : ''

  const systemPrompt = `Sen "${storeName}" adlı e-ticaret mağazasının WhatsApp asistanısın. Adın: ${botName}

${customerSection}

Aktif kampanyalar:
${campaignSection}
${knowledgeSection}

Yanıt kuralları:
- ${TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.friendly}
- Maksimum ${maxSentences} cümle yaz.
- ${EMOJI_INSTRUCTIONS[emojiUsage] ?? EMOJI_INSTRUCTIONS.low}
- Bilmediğin bir şey sorulursa "Sizi mağazamızın ekibiyle bağlayabilirim" de.
- Türkçe yanıt ver.
- Asla markdown kullanma, düz metin yaz.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: responseLength === 'short' ? 150 : 300,
      temperature: 0.6,
    })

    return response.choices[0]?.message?.content?.trim() ?? (botSettings?.fallbackMessage ?? fallbackReply(storeName))
  } catch {
    return botSettings?.fallbackMessage ?? fallbackReply(storeName)
  }
}

function translateStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'Beklemede',
    confirmed: 'Onaylandı',
    shipped: 'Kargoya Verildi',
    delivered: 'Teslim Edildi',
    cancelled: 'İptal Edildi',
    refunded: 'İade Edildi',
    paid: 'Ödendi',
  }
  return map[status] ?? status
}

function fallbackReply(storeName: string): string {
  return `Merhaba! ${storeName} müşteri hizmetlerine hoş geldiniz. Size nasıl yardımcı olabilirim?`
}
