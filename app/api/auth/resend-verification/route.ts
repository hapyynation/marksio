import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getSystemFromAddress } from '@/lib/mail-from'
import { rateLimit } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string }
    if (!email) return NextResponse.json({ error: 'Email gerekli' }, { status: 400 })

    const rl = rateLimit(`resend_verify:${email.toLowerCase()}`, 3, 60 * 60 * 1000) // 3/email/saat
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Doğrulama e-postası zaten gönderildi. Lütfen bekleyin.' },
        { status: 429 },
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Silent for non-existent or already verified users (prevent enumeration)
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true })
    }

    await prisma.emailVerification.deleteMany({ where: { userId: user.id } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.emailVerification.create({
      data: { userId: user.id, token, expiresAt },
    })

    const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`

    console.log('[resend-verification] Sending email to:', email)
    const { error: emailError } = await resend.emails.send({
      from: getSystemFromAddress(),
      to: email,
      subject: 'E-postanızı doğrulayın — Marksio',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050505;font-family:Inter,system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#131313;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;max-width:480px;width:100%">
        <tr><td style="height:2px;background:linear-gradient(90deg,#0066ff,#00f1fe)"></td></tr>
        <tr><td style="padding:32px 36px 24px">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#0066ff,#00f1fe);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle">
              <span style="font-size:16px;color:#fff;font-weight:900">M</span>
            </td>
            <td style="padding-left:10px;font-size:15px;font-weight:900;color:#e5e2e1">Marksio</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0 36px 32px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#e5e2e1">E-postanızı doğrulayın</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#8c90a1;line-height:1.6">
            Doğrulama linkini yeniden gönderdik. Aşağıdaki düğmeye tıklayarak hesabınızı aktifleştirebilirsiniz.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#0066ff,#00f1fe)">
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none">
              E-postamı Doğrula
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#424656;line-height:1.5">
            Bu düğme çalışmıyorsa:<br>
            <a href="${verifyUrl}" style="color:#6b9fff;word-break:break-all">${verifyUrl}</a>
          </p>
          <p style="margin:16px 0 0;font-size:11px;color:#424656">
            Bu link 24 saat geçerlidir.
          </p>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05)">
          <p style="margin:0;font-size:11px;color:#424656">© 2025 Marksio · Tüm hakları saklıdır</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    if (emailError) {
      console.error('[resend-verification] Resend error:', JSON.stringify(emailError))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[resend-verification]', err)
    return NextResponse.json({ error: 'Email gönderilemedi' }, { status: 500 })
  }
}
