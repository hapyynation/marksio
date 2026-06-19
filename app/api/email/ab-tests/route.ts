import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const tests = await prisma.aBTest.findMany({
    where: {
      userId: uid,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tests, total: tests.length })
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const uid = session.user.id
  const body = await req.json() as {
    name?: string
    campaignId?: string
    variantA?: Record<string, unknown>
    variantB?: Record<string, unknown>
    splitPercent?: number
  }

  if (!body.name?.trim()) return NextResponse.json({ error: 'Test adı gerekli' }, { status: 400 })
  if (!body.variantA || !body.variantB) return NextResponse.json({ error: 'İki varyant gerekli' }, { status: 400 })

  const split = body.splitPercent ?? 50
  if (split < 10 || split > 90) return NextResponse.json({ error: 'Bölünme oranı 10-90 arasında olmalı' }, { status: 400 })

  const test = await prisma.aBTest.create({
    data: {
      userId:       uid,
      name:         body.name.trim(),
      campaignId:   body.campaignId,
      variantA:     body.variantA as object,
      variantB:     body.variantB as object,
      splitPercent: split,
      status:       'draft',
    },
  })

  return NextResponse.json(test, { status: 201 })
}
