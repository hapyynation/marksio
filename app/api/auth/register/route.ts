import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { getSystemFromAddress } from '@/lib/mail-from'
import { rateLimit, getIp } from '@/lib/rate-limit'

const resend = new Resend(process.env.RESEND_API_KEY)
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, storeName } = await req.json()

    if (!name || !email || !password || !storeName) {
      return NextResponse.json({ error: 'Tüm alanlar zorunlu' }, { status: 400 })
    }

    const ip = getIp(req.headers)
    const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000) // 5/IP/saat
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Bu IP adresinden çok fazla kayıt denemesi yapıldı.' },
        { status: 429 },
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Bu email zaten kayıtlı' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, storeName, emailVerified: false },
    })

    await prisma.segment.createMany({
      data: [
        { userId: user.id, name: 'VIP Müşteriler', type: 'builtin', color: 'amber', icon: 'Crown', description: '5+ sipariş, ₺10.000+ harcama', count: 0 },
        { userId: user.id, name: 'Sadık Müşteriler', type: 'builtin', color: 'violet', icon: 'Heart', description: '3-5 sipariş, düzenli alıcılar', count: 0 },
        { userId: user.id, name: 'Risk Altında', type: 'builtin', color: 'red', icon: 'AlertTriangle', description: '60+ gün inaktif', count: 0 },
        { userId: user.id, name: 'Yeni Müşteriler', type: 'builtin', color: 'emerald', icon: 'UserPlus', description: 'Son 30 günde kayıt', count: 0 },
        { userId: user.id, name: 'Pasif Müşteriler', type: 'builtin', color: 'gray', icon: 'UserMinus', description: '90+ gün inaktif', count: 0 },
      ],
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.emailVerification.create({
      data: { userId: user.id, token, expiresAt },
    })

    const verifyUrl = `${BASE_URL}/api/auth/verify-email?token=${token}`

    await resend.emails.send({
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
          <p style="margin:0 0 8px;font-size:14px;color:#8c90a1;line-height:1.6">Merhaba ${name},</p>
          <p style="margin:0 0 24px;font-size:14px;color:#8c90a1;line-height:1.6">
            Marksio hesabınızı oluşturduğunuz için teşekkürler. Hesabınızı aktifleştirmek için aşağıdaki düğmeye tıklayın.
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
            Bu link 24 saat geçerlidir. Hesap oluşturmadıysanız bu emaili görmezden gelebilirsiniz.
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

    return NextResponse.json({ success: true, userId: user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Kayıt hatası'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
