import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { getSystemFromAddress } from '@/lib/mail-from'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, storeName: true, name: true, email: true },
  })

  if (user?.plan !== 'agency') {
    return NextResponse.json({ error: 'Takım özelliği sadece Agency planında kullanılabilir' }, { status: 403 })
  }

  const { email, role } = await req.json() as { email?: string; role?: string }
  if (!email?.trim()) {
    return NextResponse.json({ error: 'E-posta adresi gerekli' }, { status: 400 })
  }

  const validRoles = ['Üye', 'Yönetici', 'Görüntüleyici']
  const inviteRole = validRoles.includes(role ?? '') ? role : 'Üye'

  const storeName = user.storeName ?? 'Marksio'
  const inviterName = user.name ?? storeName

  const { error } = await resend.emails.send({
    from: getSystemFromAddress('Marksio'),
    to: [email.trim()],
    subject: `${inviterName} sizi ${storeName} ekibine davet etti`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#08080f;color:#eeeef4;">
        <img src="https://marksio.app/logo.png" alt="Marksio" style="height:28px;margin-bottom:32px;" />
        <h2 style="font-size:20px;font-weight:700;margin:0 0 8px;">${inviterName} sizi davet etti</h2>
        <p style="color:#8080a0;margin:0 0 24px;">${storeName} ekibine <strong style="color:#eeeef4;">${inviteRole}</strong> olarak katılmaya davet edildiniz.</p>
        <a href="https://marksio.app/auth/signup?invite=${encodeURIComponent(email.trim())}&store=${encodeURIComponent(storeName)}"
           style="display:inline-block;background:#4470ff;color:#fff;padding:12px 24px;border-radius:10px;font-weight:600;text-decoration:none;">
          Daveti Kabul Et →
        </a>
        <p style="color:#3e3e54;font-size:12px;margin-top:32px;">Bu daveti istemediyseniz bu emaili yoksayabilirsiniz.</p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error: 'Davet emaili gönderilemedi' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
