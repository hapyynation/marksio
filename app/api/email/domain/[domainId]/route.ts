import { NextResponse } from 'next/server'

import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function DELETE(
  _req: Request,
  { params }: { params: { domainId: string } }
) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const emailDomain = await prisma.emailDomain.findFirst({
    where: { id: params.domainId, userId: user.id },
  })
  if (!emailDomain) return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 })

  if (emailDomain.resendId) {
    try { await resend.domains.remove(emailDomain.resendId) } catch {}
  }

  await prisma.emailDomain.delete({ where: { id: params.domainId } })
  return NextResponse.json({ ok: true })
}
