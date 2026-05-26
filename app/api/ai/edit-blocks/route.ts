import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { blocks, instruction, storeName, channel } = await req.json()
  if (!blocks || !instruction) return NextResponse.json({ error: 'blocks ve instruction zorunlu' }, { status: 400 })

  const blockSummary = blocks.map((b: { type: string; c: Record<string, string> }) => {
    const fields = Object.entries(b.c)
      .filter(([, v]) => v && String(v).length < 300)
      .map(([k, v]) => `${k}: "${v}"`)
      .join(', ')
    return `[${b.type}] ${fields}`
  }).join('\n')

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `Sen Türk e-ticaret markası için email/WhatsApp kampanya içeriği düzenleyen bir uzman copywriter'sın.
Mağaza adı: ${storeName || 'Mağaza'}
Kanal: ${channel === 'whatsapp' ? 'WhatsApp mesajı' : 'Email'}

Kullanıcı senden belirli bir değişiklik yapmanı isteyecek. Mevcut blokların içeriğini bu isteğe göre güncelle.

ÖNEMLİ KURALLAR:
- Yalnızca içerik alanlarını değiştir (c objesi içindeki string değerleri)
- Blok tiplerini (type) ve id'leri HİÇBİR ZAMAN değiştirme
- Tüm blok dizisini JSON olarak döndür
- {{isim}}, {{siparis_no}} gibi template değişkenlerini koru
- Türkçe yaz, profesyonel ve dönüşüm odaklı ol
- Yanıt SADECE JSON olsun, hiç açıklama ekleme`,
        },
        {
          role: 'user',
          content: `Mevcut bloklar:\n${blockSummary}\n\nİstek: ${instruction}\n\nGüncellenmiş blokları JSON dizisi olarak döndür.`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0].message.content || '{}'
    let parsed: { blocks?: unknown[] }
    try {
      parsed = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: 'AI yanıtı parse edilemedi' }, { status: 500 })
    }

    const updatedBlocks = parsed.blocks
    if (!Array.isArray(updatedBlocks) || updatedBlocks.length === 0) {
      return NextResponse.json({ error: 'AI geçerli blok döndürmedi' }, { status: 500 })
    }

    // Yalnızca c alanlarını güncelle, id ve type'ı koru
    const merged = blocks.map((original: { id: string; type: string; c: Record<string, string> }) => {
      const updated = updatedBlocks.find((u: unknown) => (u as { id?: string }).id === original.id) as { c?: Record<string, string> } | undefined
      if (!updated || !updated.c) return original
      return { ...original, c: { ...original.c, ...updated.c } }
    })

    return NextResponse.json({ blocks: merged })
  } catch (err) {
    console.error('[edit-blocks]', err)
    return NextResponse.json({ error: 'AI içerik düzenleyemedi' }, { status: 500 })
  }
}
