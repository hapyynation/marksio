import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domainId } = await req.json()
  if (!domainId) return NextResponse.json({ error: 'domainId gerekli' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const emailDomain = await prisma.emailDomain.findFirst({
    where: { id: domainId, userId: user.id },
  })
  if (!emailDomain) return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 })
  if (!emailDomain.resendId) return NextResponse.json({ error: 'Resend domain ID yok' }, { status: 400 })

  try {
    const result = await resend.domains.get(emailDomain.resendId)
    const domainData = result.data

    const status = domainData?.status === 'verified' ? 'verified' : 'pending'
    const dnsRecords = domainData?.records ?? JSON.parse(emailDomain.dnsRecords as string)

    const updated = await prisma.emailDomain.update({
      where: { id: domainId },
      data: {
        status,
        dnsRecords: JSON.stringify(dnsRecords),
      },
    })

    return NextResponse.json({ domain: updated, status, dnsRecords })
  } catch (err) {
    console.error('Resend domain verify error:', err)
    return NextResponse.json({ error: 'Doğrulama başarısız' }, { status: 500 })
  }
}
