import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { getCanvaAuthUrl, generatePkce } from '@/lib/canva'
import { randomBytes } from 'crypto'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const state = randomBytes(16).toString('hex')
  const { verifier, challenge } = generatePkce()

  const url = getCanvaAuthUrl(state, challenge)

  const res = NextResponse.redirect(url)

  // Store verifier + state in cookies (httpOnly, 10 min TTL)
  res.cookies.set('canva_pkce_verifier', verifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  res.cookies.set('canva_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })

  return res
}
