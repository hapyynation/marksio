import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

const META_API = 'https://graph.facebook.com/v19.0'

export async function sendBatch(
  broadcastId: string,
  phoneNumbers: string[],
  account: { id: string; phoneNumberId: string; accessToken: string },
  template: { metaTemplateId: string; name: string; language: string; componentsJson: unknown },
) {
  const accessToken = decrypt(account.accessToken)

  for (const phoneNumber of phoneNumbers) {
    const contact = await prisma.whatsappContact.findFirst({
      where: { phoneNumber },
      select: { id: true },
    })

    let conversation = contact
      ? await prisma.whatsappConversation.findFirst({
          where: { contact: { phoneNumber }, accountId: account.id, status: { not: 'CLOSED' } },
          select: { id: true },
        })
      : null

    if (!conversation && contact) {
      conversation = await prisma.whatsappConversation.create({
        data: { contactId: contact.id, accountId: account.id, status: 'AI_HANDLING' },
        select: { id: true },
      })
    }

    const msgRecord = conversation
      ? await prisma.whatsappMessage.create({
          data: {
            conversationId: conversation.id,
            direction: 'OUTBOUND',
            status: 'QUEUED',
            broadcastId,
          },
        })
      : null

    const metaRes = await fetch(`${META_API}/${account.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'template',
        template: {
          name: template.name,
          language: { code: template.language },
        },
      }),
    }).catch(() => null)

    if (metaRes?.ok) {
      const data = await metaRes.json() as { messages?: Array<{ id?: string }> }
      const metaMessageId = data.messages?.[0]?.id ?? null

      if (msgRecord) {
        await prisma.whatsappMessage.update({
          where: { id: msgRecord.id },
          data: { status: 'SENT', metaMessageId },
        })
      }
      await prisma.whatsappBroadcast.update({
        where: { id: broadcastId },
        data: { sentCount: { increment: 1 } },
      })
    } else {
      const errData = metaRes ? await metaRes.json().catch(() => ({})) : {}
      const reason = (errData as { error?: { message?: string } })?.error?.message ?? 'Bilinmeyen hata'
      console.error('[WhatsApp Broadcast] Meta API hatası:', {
        status: metaRes?.status,
        error: (errData as { error?: unknown })?.error,
        phoneNumber,
        broadcastId,
      })

      if (msgRecord) {
        await prisma.whatsappMessage.update({
          where: { id: msgRecord.id },
          data: { status: 'FAILED', errorReason: reason },
        })
      }
      await prisma.whatsappBroadcast.update({
        where: { id: broadcastId },
        data: { failedCount: { increment: 1 } },
      })
    }
  }
}
