import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { id } = await params

  const customer = await prisma.customer.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!customer) return NextResponse.json({ error: 'Müşteri bulunamadı' }, { status: 404 })

  await prisma.customer.update({
    where: { id },
    data: { unsubscribed: false },
  })

  return NextResponse.json({ success: true })
}
