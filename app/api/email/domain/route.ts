import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const domains = await prisma.emailDomain.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ domains })
}

// Custom domain registration is disabled — Resend free plan supports a single
// verified domain (mg.marksio.com). Re-enable by restoring Resend domain.create
// call when the plan is upgraded.
export async function POST() {
  return NextResponse.json(
    { error: 'Özel domain bağlama şu an devre dışıdır. Tüm gönderimler mg.marksio.com üzerinden yapılmaktadır.' },
    { status: 503 }
  )
}

// PATCH — update sender settings for an existing domain
export async function PATCH(req: Request) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { domainId: string; fromPrefix?: string; senderName?: string }
  if (!body.domainId) return NextResponse.json({ error: 'domainId gerekli' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  type DomainWithSender = { id: string; domain: string; fromPrefix?: string; senderName?: string | null; fromEmail?: string | null }
  const domain = await prisma.emailDomain.findFirst({
    where: { id: body.domainId, userId: user.id },
  }) as DomainWithSender | null
  if (!domain) return NextResponse.json({ error: 'Domain bulunamadı' }, { status: 404 })

  const fromPrefix = body.fromPrefix
    ? body.fromPrefix.toLowerCase().replace(/[^a-z0-9._-]/g, '')
    : (domain.fromPrefix ?? 'kampanya')
  const senderName = body.senderName !== undefined ? body.senderName.trim() || null : (domain.senderName ?? null)

  const updated = await prisma.emailDomain.update({
    where: { id: domain.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { fromPrefix, senderName, fromEmail: `${fromPrefix}@${domain.domain}` } as any,
  })

  return NextResponse.json({ domain: updated })
}
