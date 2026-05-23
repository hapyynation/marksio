const META_API_VERSION = 'v19.0'

export async function sendWhatsAppMessage({
  phoneNumberId,
  accessToken,
  to,
  body,
}: {
  phoneNumberId: string
  accessToken: string
  to: string
  body: string
}) {
  const phone = to.replace(/\D/g, '')
  const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone,
      type: 'text',
      text: { body },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any)?.error?.message ?? `Meta API hatası: ${res.status}`)
  }

  return res.json()
}
