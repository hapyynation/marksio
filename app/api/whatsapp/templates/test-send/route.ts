import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { decrypt } from '@/lib/encryption'

const META_API = 'https://graph.facebook.com/v19.0'

interface TemplateComp {
  type: string
  text?: string
  buttons?: Array<{ type: string; text: string }>
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    templateId?: string
    toPhone?: string
    variables?: Record<string, string> // { "1": "value", "2": "value" }
  }

  if (!body.templateId || !body.toPhone) {
    return NextResponse.json({ error: 'templateId ve toPhone zorunludur.' }, { status: 400 })
  }

  const phone = body.toPhone.replace(/\D/g, '')
  if (phone.length < 10) {
    return NextResponse.json({ error: 'Geçerli bir telefon numarası girin (örn: 905551234567).' }, { status: 400 })
  }

  const template = await prisma.whatsappTemplate.findFirst({
    where: { id: body.templateId, account: { userId: session.user.id } },
    include: {
      account: { select: { phoneNumberId: true, accessToken: true, status: true } },
    },
  })

  if (!template) return NextResponse.json({ error: 'Şablon bulunamadı.' }, { status: 404 })
  if (template.account.status !== 'CONNECTED') {
    return NextResponse.json({ error: 'WhatsApp hesabı bağlı değil.' }, { status: 400 })
  }
  if (template.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Yalnızca onaylı şablonlar gönderilebilir.' }, { status: 400 })
  }

  const accessToken = decrypt(template.account.accessToken)
  const components = template.componentsJson as unknown as TemplateComp[]

  // Build variable parameters for BODY component
  const metaComponents: Array<{ type: string; parameters: Array<{ type: string; text: string }> }> = []
  const bodyComp = components.find(c => c.type === 'BODY')
  if (bodyComp?.text && body.variables && Object.keys(body.variables).length > 0) {
    const sortedKeys = Object.keys(body.variables).sort((a, b) => Number(a) - Number(b))
    const params = sortedKeys.map(k => ({ type: 'text', text: body.variables![k] ?? '' }))
    if (params.length > 0) {
      metaComponents.push({ type: 'body', parameters: params })
    }
  }

  const metaRes = await fetch(`${META_API}/${template.account.phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'template',
      template: {
        name: template.name,
        language: { code: template.language },
        ...(metaComponents.length > 0 ? { components: metaComponents } : {}),
      },
    }),
  }).catch(() => null)

  if (!metaRes?.ok) {
    const err = metaRes ? await metaRes.json().catch(() => ({})) : {}
    const msg = (err as { error?: { message?: string } })?.error?.message ?? 'Meta API hatası'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const data = await metaRes.json() as { messages?: Array<{ id?: string }> }
  const metaMessageId = data.messages?.[0]?.id ?? null

  return NextResponse.json({ ok: true, metaMessageId, to: phone })
}
