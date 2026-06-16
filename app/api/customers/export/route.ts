import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const { searchParams } = new URL(req.url)
  const segment = searchParams.get('segment')
  const idsParam = searchParams.get('ids')
  const ids = idsParam ? idsParam.split(',').filter(Boolean) : null

  const customers = await prisma.customer.findMany({
    where: {
      userId,
      ...(ids?.length ? { id: { in: ids } } : {}),
      ...(segment && segment !== 'all' ? { segment } : {}),
    },
    select: {
      firstName: true, lastName: true, name: true, email: true, phone: true,
      totalSpent: true, totalOrders: true, avgOrder: true, segment: true,
      tags: true, source: true, createdAt: true, lastOrder: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'Ad', 'Soyad', 'Tam Ad', 'Email', 'Telefon',
    'Toplam Harcama', 'Sipariş Sayısı', 'Ort. Sipariş',
    'Segment', 'Etiketler', 'Kaynak', 'Kayıt Tarihi', 'Son Sipariş',
  ]

  const rows = customers.map(c => {
    let tags = ''
    try { const t = JSON.parse(c.tags); tags = Array.isArray(t) ? t.join(';') : '' } catch { /* */ }
    return [
      c.firstName ?? '',
      c.lastName ?? '',
      c.name,
      c.email,
      c.phone ?? '',
      c.totalSpent.toFixed(2),
      String(c.totalOrders),
      c.avgOrder.toFixed(2),
      c.segment,
      tags,
      c.source,
      c.createdAt.toISOString().split('T')[0],
      c.lastOrder ? c.lastOrder.toISOString().split('T')[0] : '',
    ]
  })

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  return new Response('﻿' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="musteriler-${Date.now()}.csv"`,
    },
  })
}
