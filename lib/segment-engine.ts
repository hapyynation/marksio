import { prisma } from '@/lib/prisma'

export type RuleOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'neq' | 'contains' | 'not_contains'

export interface SegmentRule {
  field: string
  operator: RuleOperator
  value: string | number
}

// ─── Default segment definitions ─────────────────────────────────────────────

export const DEFAULT_SEGMENTS: Array<{
  name: string; description: string; color: string; icon: string
  rules: SegmentRule[]; matchType: 'all' | 'any'
}> = [
  {
    name: 'VIP Customers',
    description: 'Toplam harcaması ₺10.000+ ve 10+ sipariş veren en değerli müşteriler',
    color: '#f0a020', icon: '👑',
    matchType: 'all',
    rules: [
      { field: 'totalSpent',  operator: 'gte', value: 10000 },
      { field: 'totalOrders', operator: 'gte', value: 10 },
    ],
  },
  {
    name: 'High Spenders',
    description: 'Toplam harcaması ₺5.000 üzerinde olan müşteriler',
    color: '#9f7afa', icon: '💎',
    matchType: 'all',
    rules: [{ field: 'totalSpent', operator: 'gte', value: 5000 }],
  },
  {
    name: 'Loyal Customers',
    description: 'En az 5 kez sipariş vermiş sadık müşteriler',
    color: '#4470ff', icon: '🤝',
    matchType: 'all',
    rules: [{ field: 'totalOrders', operator: 'gte', value: 5 }],
  },
  {
    name: 'New Customers',
    description: 'Yeni kayıt olmuş, 1 veya hiç sipariş vermemiş müşteriler',
    color: '#22c97a', icon: '✨',
    matchType: 'all',
    rules: [{ field: 'totalOrders', operator: 'lte', value: 1 }],
  },
  {
    name: 'At Risk',
    description: 'Son 60-90 gündür alışveriş yapmayan, risk altındaki müşteriler',
    color: '#f0a020', icon: '⚠️',
    matchType: 'all',
    rules: [
      { field: 'daysSinceOrder', operator: 'gte', value: 60 },
      { field: 'daysSinceOrder', operator: 'lt',  value: 90 },
    ],
  },
  {
    name: 'Churn Risk',
    description: 'Son 90-180 gündür alışveriş yapmayan, kayıp riski yüksek müşteriler',
    color: '#e84545', icon: '🚨',
    matchType: 'all',
    rules: [
      { field: 'daysSinceOrder', operator: 'gte', value: 90 },
      { field: 'daysSinceOrder', operator: 'lt',  value: 180 },
    ],
  },
  {
    name: 'Inactive Customers',
    description: '180+ gündür hiç alışveriş yapmayan pasif müşteriler',
    color: '#8080a0', icon: '💤',
    matchType: 'all',
    rules: [{ field: 'daysSinceOrder', operator: 'gte', value: 180 }],
  },
  {
    name: 'Recent Buyers',
    description: 'Son 30 gün içinde alışveriş yapmış aktif müşteriler',
    color: '#22c97a', icon: '🛒',
    matchType: 'all',
    rules: [{ field: 'daysSinceOrder', operator: 'lte', value: 30 }],
  },
]

// ─── Customer row builder ─────────────────────────────────────────────────────

type CustomerRow = {
  totalSpent: number
  totalOrders: number
  avgOrder: number
  lastOrder: Date | null
  tags: string
  source: string
  segment: string
  score: number
  shippingCountry?: string | null
}

function buildRow(c: CustomerRow): Record<string, unknown> {
  const daysSinceOrder = c.lastOrder
    ? Math.floor((Date.now() - new Date(c.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
    : 99999
  let tagsArr: string[] = []
  try { tagsArr = JSON.parse(c.tags) as string[] } catch { /* */ }
  return {
    totalSpent:      c.totalSpent,
    totalOrders:     c.totalOrders,
    avgOrder:        c.avgOrder,
    daysSinceOrder,
    score:           c.score,
    source:          c.source,
    segment:         c.segment,
    country:         c.shippingCountry ?? '',
    tags:            c.tags,
    _tagsArr:        tagsArr,
  }
}

// ─── Rule evaluator ───────────────────────────────────────────────────────────

function evalRule(row: Record<string, unknown>, rule: SegmentRule): boolean {
  const { field, operator, value } = rule

  // Tags: check array membership
  if (field === 'tags') {
    const arr = row['_tagsArr'] as string[]
    const target = String(value).toLowerCase()
    if (operator === 'contains')     return arr.some(t => t.toLowerCase().includes(target))
    if (operator === 'not_contains') return !arr.some(t => t.toLowerCase().includes(target))
    if (operator === 'eq')           return arr.includes(String(value))
    return false
  }

  const raw = row[field]
  if (raw === undefined || raw === null) {
    // daysSinceOrder with null lastOrder already handled in buildRow (99999)
    return false
  }

  const num = Number(raw)
  const targetNum = Number(value)
  const str = String(raw).toLowerCase()
  const targetStr = String(value).toLowerCase()

  switch (operator) {
    case 'gt':           return num > targetNum
    case 'lt':           return num < targetNum
    case 'gte':          return num >= targetNum
    case 'lte':          return num <= targetNum
    case 'eq':           return str === targetStr || num === targetNum
    case 'neq':          return str !== targetStr && num !== targetNum
    case 'contains':     return str.includes(targetStr)
    case 'not_contains': return !str.includes(targetStr)
    default:             return false
  }
}

export function matchesRules(
  customer: CustomerRow,
  rules: SegmentRule[],
  matchType: 'all' | 'any' = 'all',
): boolean {
  if (!rules.length) return true
  const row = buildRow(customer)
  return matchType === 'all'
    ? rules.every(r => evalRule(row, r))
    : rules.some(r => evalRule(row, r))
}

// ─── Count computation ────────────────────────────────────────────────────────

export async function computeSegmentCount(
  userId: string,
  rules: SegmentRule[],
  matchType: 'all' | 'any' = 'all',
): Promise<number> {
  const customers = await prisma.customer.findMany({
    where: { userId },
    select: { totalSpent: true, totalOrders: true, avgOrder: true, lastOrder: true, tags: true, source: true, segment: true, score: true },
  })
  return customers.filter(c => matchesRules(c, rules, matchType)).length
}

// ─── Bulk apply ───────────────────────────────────────────────────────────────

export async function applySegmentRules(userId: string): Promise<number> {
  const segments = await prisma.segment.findMany({ where: { userId } })
  const customers = await prisma.customer.findMany({
    where: { userId },
    select: { id: true, totalSpent: true, totalOrders: true, avgOrder: true, lastOrder: true, tags: true, source: true, segment: true, score: true },
  })

  let refreshed = 0
  for (const seg of segments) {
    let rules: SegmentRule[] = []
    try { rules = JSON.parse(seg.rules) } catch { continue }
    const matchType = (seg.matchType ?? 'all') as 'all' | 'any'
    const count = customers.filter(c => matchesRules(c, rules, matchType)).length
    await prisma.segment.update({ where: { id: seg.id }, data: { count } })
    refreshed++
  }
  return refreshed
}

// ─── Seed default segments ───────────────────────────────────────────────────

export async function seedDefaultSegments(userId: string) {
  const customers = await prisma.customer.findMany({
    where: { userId },
    select: { totalSpent: true, totalOrders: true, avgOrder: true, lastOrder: true, tags: true, source: true, segment: true, score: true },
  })

  const created = await Promise.all(
    DEFAULT_SEGMENTS.map(def => {
      const count = customers.filter(c => matchesRules(c, def.rules, def.matchType)).length
      return prisma.segment.create({
        data: {
          userId,
          name:        def.name,
          description: def.description,
          type:        'builtin',
          rules:       JSON.stringify(def.rules),
          matchType:   def.matchType,
          color:       def.color,
          icon:        def.icon,
          count,
          active:      true,
        },
      })
    })
  )
  return created
}
