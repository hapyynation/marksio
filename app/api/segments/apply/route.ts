import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { applySegmentRules } from '@/lib/segment-engine'

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const updated = await applySegmentRules(session.user.id)
    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('[Segments Apply]', err)
    return NextResponse.json({ error: 'Segment kuralları uygulanamadı' }, { status: 500 })
  }
}
