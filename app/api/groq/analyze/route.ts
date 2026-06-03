import { NextResponse } from 'next/server'
import { groq, GROQ_MODEL } from '@/lib/groq'
import { storeStats, segmentStats } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'

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

export async function GET() {
  try {
    const prompt = `Aşağıdaki e-ticaret mağazası verisini analiz et ve 3 somut pazarlama önerisi ver.

Mağaza Verileri:
- Aylık gelir: ${formatCurrency(storeStats.totalRevenue)}, büyüme: +${storeStats.revenueGrowth}%
- Toplam müşteri: ${storeStats.totalCustomers}
- Email açılma: %${storeStats.emailOpenRate}
- Ortalama sipariş: ${formatCurrency(storeStats.avgOrderValue)}

Segmentler:
- VIP: ${segmentStats.vip.count} kişi
- Risk altında: ${segmentStats.at_risk.count} kişi (acil!)
- Pasif: ${segmentStats.inactive.count} kişi

SADECE JSON döndür, başka hiçbir şey yazma:
{"insights": [{"title": "başlık", "desc": "kısa açıklama", "priority": "high|medium|low", "action": "ne yapılmalı"}], "weeklyFocus": "bu hafta odaklanılacak tek şey"}`

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: 'Yanıtlarını SADECE geçerli JSON formatında ver. JSON dışında hiçbir şey yazma.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.5,
    })

    const responseText = completion.choices[0]?.message?.content ?? ''
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI yanıtı geçersiz format')

    return NextResponse.json(safeParseJSON(jsonMatch[0]))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analiz hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
