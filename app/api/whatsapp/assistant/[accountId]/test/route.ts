import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const TONE_MAP: Record<string, string> = {
  FRIENDLY: 'Samimi ve sıcak bir dil kullan. Müşteriyi rahatlatıcı bir şekilde yanıtla.',
  FORMAL: 'Profesyonel ve kurumsal bir dil kullan. Kibar ve saygılı ol.',
  PROFESSIONAL: 'Kısa, net ve profesyonel cevaplar ver. Gereksiz söz kullanma.',
}

const LENGTH_MAP: Record<string, { sentences: number; tokens: number }> = {
  SHORT: { sentences: 2, tokens: 120 },
  MEDIUM: { sentences: 4, tokens: 250 },
  LONG: { sentences: 6, tokens: 400 },
}

const CONFIDENCE_MAP: Record<string, string> = {
  LOW: 'Emin olmadığın konularda mutlaka "Sizi temsilcimize bağlayabilirim" de. Yalnızca kesin bilgileri paylaş.',
  MEDIUM: 'Bildiğin konularda kendinden emin cevaplar ver. Bilmediğin konularda temsilciye yönlendir.',
  HIGH: 'Tüm konularda özgürce yanıt ver. Makul çıkarımlar yapabilirsin.',
}

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: params.accountId, userId: session.user.id },
    select: { id: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  const body = await req.json() as { message?: string }
  if (!body.message?.trim()) return NextResponse.json({ error: 'Mesaj zorunlu.' }, { status: 400 })

  const config = await prisma.whatsappAssistantConfig.findUnique({
    where: { accountId: params.accountId },
    include: {
      faqs: true,
      knowledgeSources: true,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeName: true },
  })

  const tone = config?.tone ?? 'PROFESSIONAL'
  const length = config?.responseLength ?? 'MEDIUM'
  const confidence = config?.confidenceLevel ?? 'MEDIUM'
  const storeName = user?.storeName ?? 'Mağaza'

  const { sentences, tokens } = LENGTH_MAP[length] ?? LENGTH_MAP.MEDIUM

  const faqSection = config?.faqs?.length
    ? `\nSIK SORULAN SORULAR:\n${config.faqs.map(f => `S: ${f.question}\nC: ${f.answer}`).join('\n\n')}`
    : ''

  const knowledgeSection = config?.customKnowledge
    ? `\nEK BİLGİLER:\n${config.customKnowledge}`
    : ''

  const urlSection = config?.websiteUrl
    ? `\nWEB SİTESİ: ${config.websiteUrl}`
    : ''

  const sourcesSection = config?.knowledgeSources?.filter(s => s.content?.trim()).length
    ? `\nBİLGİ KAYNAKLARI (bu bilgileri kullanarak cevap ver):\n${
        config.knowledgeSources
          .filter(s => s.content?.trim())
          .map(s => {
            const label = s.sourceType === 'PDF' ? `PDF (${s.fileName ?? s.title})`
              : s.sourceType === 'WEBSITE_URL' ? `Web sitesi (${s.url ?? s.title})`
              : s.title ?? 'Bilgi'
            return `[${label}]\n${s.content!.trim().slice(0, 2000)}`
          })
          .join('\n\n')
      }`
    : ''

  const systemPrompt = `Sen "${storeName}" mağazasının WhatsApp müşteri hizmetleri asistanısın.

TON: ${TONE_MAP[tone] ?? TONE_MAP.PROFESSIONAL}
GÜVEN SEVİYESİ: ${CONFIDENCE_MAP[confidence] ?? CONFIDENCE_MAP.MEDIUM}
UZUNLUK: Maksimum ${sentences} cümle yaz.
${faqSection}${knowledgeSection}${urlSection}${sourcesSection}

KURALLAR:
- Türkçe yanıt ver.
- Markdown kullanma, düz metin yaz.
- Bilmediğin bir şey sorulursa "${config?.fallbackMessage ?? 'Sizi en kısa sürede bir temsilcimize bağlayacağız.'}" de.`

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: body.message },
      ],
      max_tokens: tokens,
      temperature: 0.6,
    })

    const reply = response.choices[0]?.message?.content?.trim() ?? config?.fallbackMessage ?? 'Size yardımcı olmak için buradayım.'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'AI yanıtı üretilemedi.' }, { status: 500 })
  }
}
