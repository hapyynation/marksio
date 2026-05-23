import { groq, GROQ_MODEL } from '@/lib/groq'

export interface CampaignGenerateParams {
  type: 'email' | 'whatsapp'
  segment: string
  goal: string
  storeName: string
  productCategory?: string
  tone?: string
}

export interface GeneratedCampaign {
  subject?: string
  previewText?: string
  body: string
  cta?: string
  tips: string[]
}

function safeParseJSON(raw: string) {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const fixed = cleaned
      .replace(/[\x00-\x09\x0b\x0c\x0e-\x1f]/g, ' ')
      .replace(/(?<!\\)\n/g, '\\n')
      .replace(/(?<!\\)\r/g, '\\r')
      .replace(/(?<!\\)\t/g, '\\t')
    return JSON.parse(fixed)
  }
}

export async function generateCampaign(params: CampaignGenerateParams): Promise<GeneratedCampaign> {
  const { type, segment, goal, storeName, productCategory, tone = 'dostane ve profesyonel' } = params

  const typeInstructions: Record<string, string> = {
    email: 'subject: dikkat çekici konu satırı. previewText: 50-90 karakter ön izleme. body: kampanya hedefini doğrudan yansıtan gövde, emojilerle zenginleştirilmiş, maks 250 kelime. cta: net aksiyon çağrısı.',
    whatsapp: 'body: samimi, kişisel, emojili WhatsApp mesajı, maks 150 kelime. Kişiselleştirme için [Ad] kullan. cta: kısa aksiyon çağrısı.',
  }

  const segmentContext: Record<string, string> = {
    vip: 'VIP müşteriler: 5+ sipariş, ₺10.000+ toplam harcama, marka sadıkları',
    loyal: 'Sadık müşteriler: 3-5 sipariş, düzenli alıcılar',
    at_risk: 'Risk altındaki müşteriler: 60+ gün inaktif, geri kazanılabilir',
    new: 'Yeni müşteriler: Son 30 günde kayıt, ilk alışverişi teşvik et',
    inactive: 'Pasif müşteriler: 90+ gün inaktif, güçlü teşvik gerekli',
  }

  const jsonSchema = type === 'email'
    ? `{"subject": "...", "previewText": "...", "body": "...", "cta": "...", "tips": ["...", "...", "..."]}`
    : `{"body": "...", "cta": "...", "tips": ["...", "...", "..."]}`

  const prompt = `Mağaza: ${storeName}
Kanal: ${type.toUpperCase()}
Hedef Segment: ${segmentContext[segment] || segment}
${productCategory ? `Ürün Kategorisi: ${productCategory}` : ''}
Kampanya Hedefi: ${goal}
Ton: ${tone}

Görev: Yukarıdaki hedefe DOĞRUDAN cevap veren, ${tone} tonunda Türkçe bir ${type.toUpperCase()} kampanyası yaz.
Mesaj hedefi tam olarak yansıtmalı — genel veya alakasız içerik üretme.

${typeInstructions[type]}

Yanıtını SADECE bu JSON formatında ver, başka hiçbir şey yazma:
${jsonSchema}`

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: 'Sen bir pazarlama uzmanısın. Yanıtlarını SADECE geçerli JSON formatında ver. JSON dışında hiçbir şey yazma.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1024,
    temperature: 0.5,
  })

  const responseText = completion.choices[0]?.message?.content ?? ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI yanıtı geçersiz format')

  return safeParseJSON(jsonMatch[0]) as GeneratedCampaign
}

export async function analyzeSegments(customerData: {
  totalCustomers: number
  avgOrderValue: number
  topCategories: string[]
}): Promise<{ recommendations: string[]; priority: string }> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: 'Yanıtlarını SADECE geçerli JSON formatında ver.' },
      { role: 'user', content: `E-ticaret mağazası için müşteri verilerini analiz et.
Veriler: toplam müşteri ${customerData.totalCustomers}, ortalama sipariş ₺${customerData.avgOrderValue}, kategoriler: ${customerData.topCategories.join(', ')}
SADECE JSON döndür: {"recommendations": ["öneri1","öneri2","öneri3","öneri4","öneri5"], "priority": "en öncelikli aksiyon"}` },
    ],
    max_tokens: 512,
    temperature: 0.5,
  })

  const responseText = completion.choices[0]?.message?.content ?? ''
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI yanıtı geçersiz format')

  return safeParseJSON(jsonMatch[0])
}
