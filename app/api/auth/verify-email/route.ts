import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?error=missing', req.url))
  }

  const verification = await prisma.emailVerification.findUnique({ where: { token } })

  if (!verification) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', req.url))
  }

  if (verification.usedAt) {
    return NextResponse.redirect(new URL('/verify-email?error=used', req.url))
  }

  if (verification.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/verify-email?error=expired', req.url))
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true },
    }),
    prisma.emailVerification.update({
      where: { id: verification.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.redirect(new URL('/verify-email?verified=1', req.url))
}
