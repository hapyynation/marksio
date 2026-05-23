import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName } = await req.json()

    if (!name || !email || !password || !storeName) {
      return NextResponse.json({ error: 'Tüm alanlar zorunlu' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Bu email zaten kayıtlı' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, storeName },
    })

    // Seed default segments for new user
    await prisma.segment.createMany({
      data: [
        { userId: user.id, name: 'VIP Müşteriler', type: 'builtin', color: 'amber', icon: 'Crown', description: '5+ sipariş, ₺10.000+ harcama', count: 0 },
        { userId: user.id, name: 'Sadık Müşteriler', type: 'builtin', color: 'violet', icon: 'Heart', description: '3-5 sipariş, düzenli alıcılar', count: 0 },
        { userId: user.id, name: 'Risk Altında', type: 'builtin', color: 'red', icon: 'AlertTriangle', description: '60+ gün inaktif', count: 0 },
        { userId: user.id, name: 'Yeni Müşteriler', type: 'builtin', color: 'emerald', icon: 'UserPlus', description: 'Son 30 günde kayıt', count: 0 },
        { userId: user.id, name: 'Pasif Müşteriler', type: 'builtin', color: 'gray', icon: 'UserMinus', description: '90+ gün inaktif', count: 0 },
      ],
    })

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
