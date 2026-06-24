import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { exchangeCode, saveCanvaTokens } from '@/lib/canva'

export async function GET(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')
  const error = searchParams.get('error')

  const verifier = req.cookies.get('canva_pkce_verifier')?.value
  const savedState = req.cookies.get('canva_oauth_state')?.value

  const redirectBase = new URL('/settings', req.url)

  if (error || !code) {
    redirectBase.searchParams.set('canva', 'error')
    return NextResponse.redirect(redirectBase)
  }

  if (!verifier || !savedState || returnedState !== savedState) {
    redirectBase.searchParams.set('canva', 'state_mismatch')
    return NextResponse.redirect(redirectBase)
  }

  try {
    const tokens = await exchangeCode(code, verifier)
    await saveCanvaTokens(session.user.id, tokens.access_token, tokens.refresh_token, tokens.expires_in)

    const res = NextResponse.redirect(new URL('/settings?canva=success', req.url))
    res.cookies.delete('canva_pkce_verifier')
    res.cookies.delete('canva_oauth_state')
    return res
  } catch (err) {
    console.error('Canva callback error:', err)
    redirectBase.searchParams.set('canva', 'error')
    return NextResponse.redirect(redirectBase)
  }
}
