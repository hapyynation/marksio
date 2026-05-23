import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { applySegmentRules } from '@/lib/segment-engine'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  try {
    const updated = await applySegmentRules(session.user.id)
    return NextResponse.json({ success: true, updated })
  } catch (err) {
    console.error('[Segments Apply]', err)
    return NextResponse.json({ error: 'Segment kuralları uygulanamadı' }, { status: 500 })
  }
}
