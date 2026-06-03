import Groq from 'groq-sdk'
import { formatCurrency } from './utils'

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const GROQ_MODEL = 'llama-3.3-70b-versatile'

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

export function buildSystemPrompt(stats: UserStats): string {
  return `Sen Marksio'nun yapay zeka asistanısın. Adın "Mark".
Mağaza: ${stats.storeName}

Veriler:
- Gelir: ${formatCurrency(stats.totalRevenue)} | Müşteri: ${stats.totalCustomers.toLocaleString('tr')} | AOV: ${formatCurrency(stats.avgOrderValue)}
- Email: ${stats.emailSent.toLocaleString('tr')} gönderim, %${stats.emailOpenRate} açılma | WA: ${stats.waSent.toLocaleString('tr')} gönderim
- Segmentler → VIP: ${stats.vipCount} | Sadık: ${stats.loyalCount} | Risk: ${stats.atRiskCount} | Yeni: ${stats.newCount} | Pasif: ${stats.inactiveCount}

Kurallar:
- Kısa ve direkt cevap ver. Uzun essay yazma.
- Somut, uygulanabilir adımlar söyle.
- Gerektiğinde tek soru sor, fazlası değil.
- Emoji nadiren kullan.
- "Harika!", "Tabii ki!", "Kesinlikle!" gibi dolgu cümlelerden kaçın.
- Marksio özellikleri: kampanya, otomasyon, segment, WhatsApp AI, email domain, AI Studio, analitik.
- Yol tarifi verirken: "Ayarlar > X > Y" formatını kullan.
- Türkçe yanıt ver.`
}

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
