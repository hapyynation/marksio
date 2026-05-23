import { prisma } from '@/lib/prisma'

interface SegmentRule {
  field: string
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'contains'
  value: string | number
}

function evaluateRule(customer: Record<string, any>, rule: SegmentRule): boolean {
  const val = customer[rule.field]
  const target = typeof rule.value === 'string' ? rule.value : Number(rule.value)

  if (val === undefined || val === null) return false

  switch (rule.operator) {
    case 'gt':  return Number(val) > Number(target)
    case 'lt':  return Number(val) < Number(target)
    case 'gte': return Number(val) >= Number(target)
    case 'lte': return Number(val) <= Number(target)
    case 'eq':  return String(val) === String(target)
    case 'neq': return String(val) !== String(target)
    case 'contains': return String(val).toLowerCase().includes(String(target).toLowerCase())
    default: return false
  }
}

function matchesSegment(customer: Record<string, any>, rules: SegmentRule[]): boolean {
  if (!rules.length) return true
  return rules.every(rule => evaluateRule(customer, rule))
}

export async function applySegmentRules(userId: string) {
  const segments = await prisma.segment.findMany({
    where: { userId, type: 'custom' },
  })

  const customers = await prisma.customer.findMany({ where: { userId } })

  let updated = 0

  for (const segment of segments) {
    let rules: SegmentRule[] = []
    try { rules = JSON.parse(segment.rules) } catch { continue }
    if (!rules.length) continue

    const segmentSlug = segment.name.toLowerCase().replace(/ /g, '_')
    const matched = customers.filter(c => matchesSegment(c as any, rules))
    const matchedIds = matched.map(c => c.id)

    await prisma.customer.updateMany({
      where: { userId, id: { in: matchedIds } },
      data: { segment: segmentSlug },
    })

    await prisma.segment.update({
      where: { id: segment.id },
      data: { count: matchedIds.length },
    })

    updated += matchedIds.length
  }

  return updated
}
