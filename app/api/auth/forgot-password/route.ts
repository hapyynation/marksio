import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getSystemFromAddress } from '@/lib/mail-from'
import { rateLimit, getIp } from '@/lib/rate-limit'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email gerekli' }, { status: 400 })

    const ip = getIp(req.headers)

    const rlIp = rateLimit(`forgot_password_ip:${ip}`, 10, 60 * 60 * 1000) // 10/IP/saat
    if (!rlIp.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika bekleyin.' },
        { status: 429 },
      )
    }

    const rlEmail = rateLimit(`forgot_password:${email.toLowerCase()}`, 3, 15 * 60 * 1000) // 3/email/15dk
    if (!rlEmail.allowed) {
      return NextResponse.json(
        { error: 'Çok fazla istek gönderdiniz. Lütfen 15 dakika bekleyin.' },
        { status: 429 },
      )
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ success: true })

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email } })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    })

    const resetUrl = `${BASE_URL}/reset-password?token=${token}`

    console.log('[forgot-password] Sending reset email to:', email)
    const { error: emailError } = await resend.emails.send({
      from: getSystemFromAddress(),
      to: email,
      subject: 'Şifre Sıfırlama — Marksio',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050505;font-family:Inter,system-ui,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#131313;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;max-width:480px;width:100%">
        <!-- gradient top line -->
        <tr><td style="height:2px;background:linear-gradient(90deg,#0066ff,#00f1fe)"></td></tr>
        <!-- header -->
        <tr><td style="padding:32px 36px 24px">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#0066ff,#00f1fe);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle">
              <span style="font-size:16px;color:#fff;font-weight:900">M</span>
            </td>
            <td style="padding-left:10px;font-size:15px;font-weight:900;color:#e5e2e1">Marksio</td>
          </tr></table>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:0 36px 32px">
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:900;color:#e5e2e1">Şifrenizi sıfırlayın</h1>
          <p style="margin:0 0 24px;font-size:14px;color:#8c90a1;line-height:1.6">
            Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki düğmeye tıklayarak yeni şifrenizi belirleyebilirsiniz.
          </p>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:linear-gradient(135deg,#0066ff,#00f1fe)">
            <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none">
              Şifremi Sıfırla
            </a>
          </td></tr></table>
          <p style="margin:24px 0 0;font-size:12px;color:#424656;line-height:1.5">
            Bu düğme çalışmıyorsa, aşağıdaki bağlantıyı tarayıcınıza yapıştırın:<br>
            <a href="${resetUrl}" style="color:#6b9fff;word-break:break-all">${resetUrl}</a>
          </p>
          <p style="margin:16px 0 0;font-size:11px;color:#424656">
            Bu bağlantı 1 saat içinde geçerliliğini yitirir. Eğer bu talebi siz yapmadıysanız bu emaili görmezden gelebilirsiniz.
          </p>
        </td></tr>
        <!-- footer -->
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.05)">
          <p style="margin:0;font-size:11px;color:#424656">© 2025 Marksio · Tüm hakları saklıdır</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
      `,
    })

    if (emailError) {
      console.error('[forgot-password] Resend error:', JSON.stringify(emailError))
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Email gönderilemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }
}
