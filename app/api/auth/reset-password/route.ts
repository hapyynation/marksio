import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Eksik parametreler' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Şifre en az 8 karakter olmalı' }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Bağlantı geçersiz veya süresi dolmuş. Yeni bir sıfırlama talebi oluşturun.' },
        { status: 400 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.email },
        data: { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Şifre güncellenemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
