import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const automation = await prisma.automation.findFirst({ where: { id: params.id, userId } })
  if (!automation) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })

  const nodeStats = await prisma.automationRunStep.groupBy({
    by: ['nodeId', 'nodeLabel', 'nodeType', 'status'],
    where: { run: { automationId: params.id } },
    _count: { status: true },
  })

  const byNode: Record<string, { nodeLabel: string | null; nodeType: string; completed: number; waiting: number; failed: number; total: number }> = {}

  for (const row of nodeStats) {
    if (!byNode[row.nodeId]) {
      byNode[row.nodeId] = { nodeLabel: row.nodeLabel, nodeType: row.nodeType, completed: 0, waiting: 0, failed: 0, total: 0 }
    }
    const count = row._count.status
    byNode[row.nodeId].total += count
    if (row.status === 'completed') byNode[row.nodeId].completed += count
    else if (row.status === 'waiting') byNode[row.nodeId].waiting += count
    else if (row.status === 'failed') byNode[row.nodeId].failed += count
  }

  return NextResponse.json(byNode)
}
