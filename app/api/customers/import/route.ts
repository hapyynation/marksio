import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { groq, GROQ_MODEL } from '@/lib/groq'

interface ExtractedContact {
  name?: string
  email?: string
  phone?: string
}

async function extractContactsWithAI(rawText: string): Promise<ExtractedContact[]> {
  const truncated = rawText.slice(0, 12000)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 45000)

  try {
    const completion = await groq.chat.completions.create(
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: `Sen bir veri çıkarma asistanısın. Kullanıcının gönderdiği ham metinden kişi bilgilerini (isim, email, telefon) çıkar ve JSON döndür.

KURALLAR:
- Yalnızca geçerli email adresleri al (@ ve . içermeli)
- Telefon numaraları: TR formatında (05xx, +90 5xx, 90 5xx, 5xx) veya uluslararası
- Email veya telefon olmayan satırları atla
- Tekrar eden email/telefon girme
- JSON dizisi döndür: [{"name":"...","email":"...","phone":"..."}]
- name bulunamazsa email'den öneki kullan
- Yanıtın SADECE JSON olsun, başka açıklama ekleme`,
          },
          {
            role: 'user',
            content: `Aşağıdaki metinden tüm kişi bilgilerini (email ve/veya telefon) çıkar:\n\n${truncated}`,
          },
        ],
        temperature: 0,
        max_tokens: 4000,
      },
      { signal: controller.signal }
    )

    const raw = completion.choices[0]?.message?.content?.trim() ?? '[]'
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []

    try {
      const parsed = JSON.parse(jsonMatch[0]) as ExtractedContact[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  } finally {
    clearTimeout(timer)
  }
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Turkish number normalization
  if (digits.startsWith('90') && digits.length === 12) return '0' + digits.slice(2)
  if (digits.startsWith('05') && digits.length === 11) return digits
  if (digits.startsWith('5') && digits.length === 10) return '0' + digits
  return phone
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  const userId = (session?.user as { id?: string })?.id
  if (!userId) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const body = await req.json()
    const rawText: string = body.csv ?? body.text ?? ''
    if (!rawText.trim()) return NextResponse.json({ error: 'Dosya içeriği boş' }, { status: 400 })

    // AI extraction
    const contacts = await extractContactsWithAI(rawText)

    if (contacts.length === 0) {
      return NextResponse.json({
        error: 'Metinde geçerli email veya telefon numarası bulunamadı. Lütfen başka bir dosya deneyin.',
      }, { status: 400 })
    }

    let imported = 0
    let skipped = 0
    const importedContacts: Array<{ name: string; email?: string; phone?: string }> = []

    for (const contact of contacts) {
      const email = contact.email?.toLowerCase().trim()
      const phone = contact.phone ? normalizePhone(contact.phone.trim()) : undefined
      const name  = contact.name?.trim() || (email ? email.split('@')[0] : phone ?? 'Müşteri')

      // Need at least email or phone
      if (!email && !phone) { skipped++; continue }
      if (email && !email.includes('@')) { skipped++; continue }

      try {
        if (email) {
          await prisma.customer.upsert({
            where: { userId_email: { userId, email } },
            update: { name, phone: phone ?? undefined },
            create: { userId, email, name, phone: phone ?? undefined, segment: 'new', source: 'csv' },
          })
        } else {
          // Phone-only: check if already exists with this phone
          const exists = await prisma.customer.findFirst({ where: { userId, phone } })
          if (exists) {
            await prisma.customer.update({ where: { id: exists.id }, data: { name } })
          } else {
            await prisma.customer.create({
              data: {
                userId,
                email: `${phone}@imported.local`,
                name,
                phone,
                segment: 'new',
                source: 'csv',
              },
            })
          }
        }
        importedContacts.push({ name, email, phone })
        imported++
      } catch {
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      preview: importedContacts.slice(0, 5),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
