import { prisma } from '@/lib/prisma'

export async function attributeAutomationRevenue(customerId: string, orderTotal: number) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
  const recentRuns = await prisma.automationRun.findMany({
    where: {
      customerId,
      status: 'completed',
      completedAt: { gte: sevenDaysAgo },
    },
    select: { automationId: true },
  })

  if (recentRuns.length === 0) return

  const automationIds = [...new Set(recentRuns.map(r => r.automationId))]
  await prisma.automation.updateMany({
    where: { id: { in: automationIds } },
    data: {
      converted: { increment: 1 },
      revenue:   { increment: orderTotal },
    },
  })
}
