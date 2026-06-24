import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id },
    select: { totalSpent: true, totalOrders: true, avgOrder: true, lastOrder: true, phone: true, segment: true },
  })

  const now = Date.now()
  function days(d: Date | null) {
    if (!d) return 99999
    return Math.floor((now - new Date(d).getTime()) / 86400000)
  }

  function est(list: typeof customers, rate: number) {
    return Math.round(list.reduce((a, c) => a + c.avgOrder * rate, 0))
  }

  const withPhone = customers.filter(c => c.phone)
  const vip         = withPhone.filter(c => c.totalSpent >= 10000 && c.totalOrders >= 10)
  const loyal       = withPhone.filter(c => c.totalOrders >= 5)
  const atRisk      = withPhone.filter(c => { const d = days(c.lastOrder); return d >= 60 && d < 90 })
  const recent30    = withPhone.filter(c => days(c.lastOrder) <= 30)
  const recent60    = withPhone.filter(c => days(c.lastOrder) <= 60)
  const inactive90  = withPhone.filter(c => days(c.lastOrder) >= 90)
  const firstOrder  = withPhone.filter(c => c.totalOrders === 1)
  const highSpend   = withPhone.filter(c => c.totalSpent >= 5000)

  const segments = [
    { id: 'all',         name: 'Tüm Aboneler',              icon: '👥', description: 'Telefon numarası olan tüm müşteriler', count: withPhone.length,  estimatedRevenue: est(withPhone, 0.08) },
    { id: 'vip',         name: 'VIP',                        icon: '👑', description: '₺10.000+ harcama, 10+ sipariş',       count: vip.length,        estimatedRevenue: est(vip, 0.25) },
    { id: 'loyal',       name: 'Sadık',                      icon: '🤝', description: '5+ sipariş veren müşteriler',         count: loyal.length,      estimatedRevenue: est(loyal, 0.18) },
    { id: 'at_risk',     name: 'Risk Altında',               icon: '⚠️', description: '60-90 gündür alışveriş yapmayan',     count: atRisk.length,     estimatedRevenue: est(atRisk, 0.12) },
    { id: 'recent_30',   name: 'Son 30 Gün Sipariş',         icon: '🛒', description: 'Son 30 günde alışveriş yapanlar',      count: recent30.length,   estimatedRevenue: est(recent30, 0.20) },
    { id: 'recent_60',   name: 'Son 60 Gün Sipariş',         icon: '🛍️', description: 'Son 60 günde alışveriş yapanlar',      count: recent60.length,   estimatedRevenue: est(recent60, 0.15) },
    { id: 'inactive_90', name: 'Son 90 Gün Pasif',           icon: '💤', description: '90+ gündür alışveriş yapmayan',       count: inactive90.length, estimatedRevenue: est(inactive90, 0.06) },
    { id: 'first_order', name: 'İlk Siparişini Verenler',    icon: '✨', description: 'Tam olarak 1 sipariş veren müşteriler',count: firstOrder.length, estimatedRevenue: est(firstOrder, 0.15) },
    { id: 'high_spend',  name: 'High Spenders',              icon: '💎', description: '₺5.000+ harcama yapan müşteriler',    count: highSpend.length,  estimatedRevenue: est(highSpend, 0.22) },
  ]

  return NextResponse.json({ segments })
}
