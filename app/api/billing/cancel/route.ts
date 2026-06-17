import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LS_API_URL } from '@/lib/lemonsqueezy'

function env(key: string): string {
  return (process.env[key] ?? '').replace(/^﻿/, '').trim()
}

export async function POST() {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { lsSubscriptionId: true, planStatus: true },
  })

  if (!user?.lsSubscriptionId) {
    return NextResponse.json({ error: 'Aktif abonelik bulunamadı' }, { status: 404 })
  }

  if (user.planStatus === 'cancelled') {
    return NextResponse.json({ error: 'Abonelik zaten iptal edilmiş' }, { status: 400 })
  }

  const apiKey = env('LEMONSQUEEZY_API_KEY')
  if (!apiKey) return NextResponse.json({ error: 'Billing yapılandırması eksik' }, { status: 500 })

  try {
    const res = await fetch(`${LS_API_URL}/subscriptions/${user.lsSubscriptionId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.api+json',
      },
    })

    if (!res.ok && res.status !== 204) {
      const errText = await res.text().catch(() => res.statusText)
      throw new Error(`Lemon Squeezy hatası (${res.status}): ${errText.slice(0, 200)}`)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { planStatus: 'cancelled' },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'İptal işlemi başarısız' },
      { status: 500 }
    )
  }
}
