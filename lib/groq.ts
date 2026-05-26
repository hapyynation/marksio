import Groq from 'groq-sdk'
import { formatCurrency } from './utils'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

// ── Kullanıcı istatistikleri tipi ────────────────────────────────────────────

export interface UserStats {
  storeName: string
  totalRevenue: number
  totalCustomers: number
  activeCampaigns: number
  avgOrderValue: number
  emailSent: number
  emailOpenRate: number
  waSent: number
  vipCount: number
  loyalCount: number
  atRiskCount: number
  newCount: number
  inactiveCount: number
}

// ── Dinamik sistem promptu ────────────────────────────────────────────────────

export function buildSystemPrompt(stats: UserStats): string {
  return `Sen Marksio'nin yapay zeka pazarlama asistanısın. Adın "Mark".
Kullanıcının mağazası: ${stats.storeName}

Güncel mağaza verileri:
- Toplam gelir: ${formatCurrency(stats.totalRevenue)}
- Toplam müşteri: ${stats.totalCustomers.toLocaleString('tr')}
- Aktif kampanya sayısı: ${stats.activeCampaigns}
- Ortalama sipariş değeri: ${formatCurrency(stats.avgOrderValue)}
- Email gönderim: ${stats.emailSent.toLocaleString('tr')}, açılma oranı: %${stats.emailOpenRate}
- WhatsApp gönderim: ${stats.waSent.toLocaleString('tr')}

Müşteri segmentleri:
- VIP: ${stats.vipCount} müşteri
- Sadık: ${stats.loyalCount} müşteri
- Risk Altında: ${stats.atRiskCount} müşteri (60+ gün inaktif)
- Yeni: ${stats.newCount} müşteri (son 30 gün)
- Pasif: ${stats.inactiveCount} müşteri (90+ gün)

Görevin:
- Kullanıcının pazarlama sorularını yanıtla
- Bu gerçek verilere dayanarak somut ve uygulanabilir öneriler ver
- Hem profesyonel hem samimi bir ton kullan — bir danışman gibi ama arkadaşça
- Türkçe yanıt ver, kısa ve net ol
- Gerektiğinde rakamlarla destekle
- Fazla uzun cevaplar verme, odaklı kal
- Emoji kullanabilirsin ama abartma`
}

// ── Fallback prompt (auth olmadan kullanılan routelar için) ──────────────────

export const SYSTEM_PROMPT = buildSystemPrompt({
  storeName: 'Mağazanız',
  totalRevenue: 0,
  totalCustomers: 0,
  activeCampaigns: 0,
  avgOrderValue: 0,
  emailSent: 0,
  emailOpenRate: 0,
  waSent: 0,
  vipCount: 0,
  loyalCount: 0,
  atRiskCount: 0,
  newCount: 0,
  inactiveCount: 0,
})
