import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { LS_API_URL } from '@/lib/lemonsqueezy'

function env(key: string): string {
  return (process.env[key] ?? '').replace(/^﻿/, '').trim()
}

interface LSOrderAttributes {
  created_at: string
  total: number
  currency: string
  status: string
  urls: { receipt: string }
  first_order_item?: { product_name: string }
}

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const apiKey = env('LEMONSQUEEZY_API_KEY')
  if (!apiKey) return NextResponse.json({ orders: [] })

  try {
    const res = await fetch(
      `${LS_API_URL}/orders?filter[user_email]=${encodeURIComponent(session.user.email)}&page[size]=10`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/vnd.api+json',
        },
      }
    )

    if (!res.ok) return NextResponse.json({ orders: [] })

    const json = await res.json() as { data: Array<{ id: string; attributes: LSOrderAttributes }> }
    const orders = (json.data ?? []).map(o => ({
      id: o.id,
      createdAt: o.attributes.created_at,
      total: o.attributes.total / 100,
      currency: o.attributes.currency,
      status: o.attributes.status,
      receiptUrl: o.attributes.urls?.receipt ?? null,
      productName: o.attributes.first_order_item?.product_name ?? 'Plan',
    }))

    return NextResponse.json({ orders })
  } catch {
    return NextResponse.json({ orders: [] })
  }
}
