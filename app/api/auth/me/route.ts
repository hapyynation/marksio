import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const bypassId = process.env.BYPASS_AUTH_USER_ID
  if (bypassId) {
    const user = await prisma.user.findUnique({
      where: { id: bypassId },
      select: { emailVerified: true, onboarded: true },
    })
    const res = NextResponse.json({
      emailVerified: true,
      onboarded: user?.onboarded ?? true,
    })
    if (user?.onboarded) {
      res.cookies.set('marksio_onboarded', '1', {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        httpOnly: true,
        sameSite: 'lax',
      })
    }
    return res
  }

  const session = await getApiSession()
  if (!session?.user?.id) {
    // Return 200 with sensible defaults so the frontend doesn't show auth errors
    // for auth-check calls (this route is informational, not a data route)
    return NextResponse.json({ emailVerified: false, onboarded: false, authenticated: false })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true, onboarded: true },
  })

  const res = NextResponse.json({
    emailVerified: user?.emailVerified ?? true,
    onboarded: user?.onboarded ?? true,
  })

  if (user?.onboarded) {
    res.cookies.set('marksio_onboarded', '1', {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  return res
}
