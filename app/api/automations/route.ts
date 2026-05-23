import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const automations = await prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(automations.map(a => ({
      ...a,
      steps: (() => { try { return JSON.parse(a.steps) } catch { return [] } })(),
    })))
  } catch (err) {
    console.error('[Automations GET]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const userId = (session.user as any).id
  try {
    const body = await req.json()
    const automation = await prisma.automation.create({
      data: {
        userId,
        name: body.name,
        trigger: body.trigger,
        status: body.status ?? 'draft',
        steps: JSON.stringify(body.steps ?? []),
        segment: body.segment,
      },
    })
    return NextResponse.json({ ...automation, steps: JSON.parse(automation.steps) }, { status: 201 })
  } catch (err) {
    console.error('[Automations POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
