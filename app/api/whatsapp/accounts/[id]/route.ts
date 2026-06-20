import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'
import { encrypt } from '@/lib/encryption'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { accessToken } = await req.json() as { accessToken?: string }
  if (!accessToken?.trim()) return NextResponse.json({ error: 'accessToken gerekli.' }, { status: 400 })

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, phoneNumberId: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  // Yeni token'ı Meta'ya karşı doğrula
  const verifyRes = await fetch(
    `https://graph.facebook.com/v19.0/${account.phoneNumberId}?fields=verified_name`,
    { headers: { Authorization: `Bearer ${accessToken.trim()}` } },
  ).catch(() => null)

  if (!verifyRes?.ok) {
    const errBody = verifyRes ? await verifyRes.json().catch(() => ({})) as { error?: { message?: string } } : {}
    return NextResponse.json(
      { error: errBody.error?.message ?? 'Token geçersiz. Meta API doğrulaması başarısız.' },
      { status: 400 },
    )
  }

  await prisma.whatsappAccount.update({
    where: { id: params.id },
    data: { accessToken: encrypt(accessToken.trim()), status: 'CONNECTED' },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const account = await prisma.whatsappAccount.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  })
  if (!account) return NextResponse.json({ error: 'Hesap bulunamadı.' }, { status: 404 })

  await prisma.whatsappAccount.update({
    where: { id: params.id },
    data: { status: 'DISCONNECTED' },
  })

  return NextResponse.json({ ok: true })
}
