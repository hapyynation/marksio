import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, storeName: true, onboardingData: true },
  })

  let phone = ''
  try { phone = (JSON.parse(user?.onboardingData ?? '{}') as { phone?: string }).phone ?? '' } catch {}

  return NextResponse.json({ name: user?.name ?? '', email: user?.email ?? '', storeName: user?.storeName ?? '', phone })
}

export async function PUT(req: Request) {
  const session = await getApiSession()
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, storeName, phone } = await req.json() as { name?: string; storeName?: string; phone?: string }

  const existing = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { onboardingData: true },
  })

  let extra: Record<string, unknown> = {}
  try { extra = JSON.parse(existing?.onboardingData ?? '{}') as Record<string, unknown> } catch {}
  if (phone !== undefined) extra.phone = phone

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      ...(name      !== undefined && { name }),
      ...(storeName !== undefined && { storeName }),
      onboardingData: JSON.stringify(extra),
    },
  })

  return NextResponse.json({ ok: true })
}
