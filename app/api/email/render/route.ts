import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { renderEmail, type EmailTemplate, type RenderProps } from '@/lib/email-renderer'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const { templateName, props } = await req.json() as {
      templateName: EmailTemplate
      props: RenderProps
    }
    if (!templateName) return NextResponse.json({ error: 'templateName gerekli' }, { status: 400 })

    const result = await renderEmail(templateName, props)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[Email render]', err)
    return NextResponse.json({ error: 'Render başarısız' }, { status: 500 })
  }
}
