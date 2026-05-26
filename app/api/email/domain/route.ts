import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const domains = await prisma.emailDomain.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ domains })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { domain } = await req.json()
  if (!domain) return NextResponse.json({ error: 'Domain gerekli' }, { status: 400 })

  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await prisma.emailDomain.findUnique({
    where: { userId_domain: { userId: user.id, domain: cleanDomain } },
  })
  if (existing) return NextResponse.json({ error: 'Bu domain zaten ekli' }, { status: 409 })

  try {
    const resendDomain = await resend.domains.create({ name: cleanDomain })

    const dnsRecords = resendDomain.data?.records ?? []

    const emailDomain = await prisma.emailDomain.create({
      data: {
        userId: user.id,
        domain: cleanDomain,
        resendId: resendDomain.data?.id,
        status: 'pending',
        dnsRecords: JSON.stringify(dnsRecords),
        fromEmail: `kampanya@${cleanDomain}`,
      },
    })

    return NextResponse.json({ domain: emailDomain, dnsRecords })
  } catch (err) {
    console.error('Resend domain create error:', err)
    return NextResponse.json({ error: 'Domain oluşturulamadı. Resend API anahtarını kontrol edin.' }, { status: 500 })
  }
}
