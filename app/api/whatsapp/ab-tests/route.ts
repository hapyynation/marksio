import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const raw = await prisma.aBTest.findMany({
    where: { userId: session.user.id, campaignId: null },
    orderBy: { createdAt: 'desc' },
  })

  const tests = raw.map(t => {
    const vA = t.variantA as { templateName?: string; traffic?: number; readRate?: number }
    const vB = t.variantB as { templateName?: string; traffic?: number; readRate?: number }
    return {
      id: t.id,
      name: t.name,
      variantA: {
        templateName: vA.templateName ?? '',
        traffic: vA.traffic ?? 50,
        readRate: vA.readRate ?? (t.openedA > 0 && t.sentA > 0 ? (t.openedA / t.sentA) * 100 : 0),
      },
      variantB: {
        templateName: vB.templateName ?? '',
        traffic: vB.traffic ?? 50,
        readRate: vB.readRate ?? (t.openedB > 0 && t.sentB > 0 ? (t.openedB / t.sentB) * 100 : 0),
      },
      status: mapStatus(t.status),
      winner: t.winnerVariant as 'A' | 'B' | null,
      audienceSize: t.sentA + t.sentB,
      createdAt: t.createdAt.toISOString(),
    }
  })

  return NextResponse.json({ tests })
}

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const body = await req.json() as {
    name?: string
    templateA?: string
    templateB?: string
    trafficA?: number
  }

  if (!body.name || !body.templateA || !body.templateB) {
    return NextResponse.json({ error: 'name, templateA ve templateB zorunludur.' }, { status: 400 })
  }

  const trafficA = body.trafficA ?? 50
  const trafficB = 100 - trafficA

  const test = await prisma.aBTest.create({
    data: {
      userId: session.user.id,
      name: body.name,
      campaignId: null,
      variantA: { templateName: body.templateA, traffic: trafficA, readRate: 0 },
      variantB: { templateName: body.templateB, traffic: trafficB, readRate: 0 },
      splitPercent: trafficA,
      status: 'running',
      startedAt: new Date(),
    },
  })

  return NextResponse.json({ id: test.id }, { status: 201 })
}

function mapStatus(s: string): 'RUNNING' | 'COMPLETED' | 'DRAFT' {
  if (s === 'running') return 'RUNNING'
  if (s === 'completed') return 'COMPLETED'
  return 'DRAFT'
}
