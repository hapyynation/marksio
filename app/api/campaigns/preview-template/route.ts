import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { renderEmail, type EmailTemplate } from '@/lib/email-renderer'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { template, props } = await req.json() as {
    template: EmailTemplate
    props: Record<string, unknown>
  }

  if (!template) {
    return NextResponse.json({ error: 'template zorunlu' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { html } = await renderEmail(template, props as any)
  return NextResponse.json({ html })
}
