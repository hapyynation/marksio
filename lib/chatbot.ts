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

interface ChatbotParams {
  storeName: string
  customerName?: string | null
  customerOrders: Order[]
  activeCampaigns: Campaign[]
  currency: string
  userMessage: string
}

export async function buildChatbotReply(params: ChatbotParams): Promise<string> {
  const { storeName, customerName, customerOrders, activeCampaigns, currency, userMessage } = params

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

  const systemPrompt = `Sen "${storeName}" adlı e-ticaret mağazasının WhatsApp müşteri hizmetleri asistanısın.

${customerSection}

Aktif kampanyalar:
${campaignSection}

Kurallar:
- Kısa, net ve samimi yanıt ver (maks 3 cümle)
- Sipariş durumu sorulursa yukarıdaki verileri kullan
- Bilmediğin bir şey sorulursa "Sizi mağazamızın ekibiyle bağlayabilirim" de
- Türkçe yanıt ver
- Emoji kullanabilirsin ama abartma
- Asla markdown kullanma, düz metin yaz`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 300,
      temperature: 0.6,
    })

    return response.choices[0]?.message?.content?.trim() ?? fallbackReply(storeName)
  } catch {
    return fallbackReply(storeName)
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
