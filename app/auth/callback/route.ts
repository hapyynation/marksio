import { NextRequest, NextResponse } from 'next/server'

// Supabase OTP/magic-link callback — no longer used.
// All auth is now handled via NextAuth CredentialsProvider (password login).
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`)
}
