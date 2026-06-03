import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY eksik.' }, { status: 500 })
  }

  const { email, bannerHtml, subject, storeName } = await req.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: 'E-posta adresi gerekli.' }, { status: 400 })
  }

  if (!bannerHtml) {
    return NextResponse.json({ error: 'Banner HTML gerekli.' }, { status: 400 })
  }

  const emailSubject = subject || 'AI Studio — Test Banner'
  const fromName = storeName || 'Marksio AI Studio'

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <onboarding@resend.dev>`,
      to: [email.trim()],
      subject: `[TEST] ${emailSubject}`,
      html: bannerHtml,
    })

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Email gönderilemedi'
    console.error('[banner-test-email]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
