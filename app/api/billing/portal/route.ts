import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LS_API_URL } from '@/lib/lemonsqueezy'

function env(key: string): string {
  return (process.env[key] ?? '').replace(/^﻿/, '').trim()
}

interface LSCustomerAttributes {
  urls: { customer_portal: string }
}

export async function GET() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lsCustomerId: true },
  })

  if (!user?.lsCustomerId) return NextResponse.json({ url: null })

  const apiKey = env('LEMONSQUEEZY_API_KEY')
  if (!apiKey) return NextResponse.json({ url: null })

  try {
    const res = await fetch(`${LS_API_URL}/customers/${user.lsCustomerId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.api+json',
      },
    })

    if (!res.ok) return NextResponse.json({ url: null })

    const json = await res.json() as { data: { attributes: LSCustomerAttributes } }
    return NextResponse.json({ url: json.data?.attributes?.urls?.customer_portal ?? null })
  } catch {
    return NextResponse.json({ url: null })
  }
}
