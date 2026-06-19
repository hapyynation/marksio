import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

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
