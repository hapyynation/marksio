import { NextRequest, NextResponse } from 'next/server'
import { generateCampaign } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, segment, goal, storeName, productCategory, tone } = body

    if (!type || !segment || !goal) {
      return NextResponse.json({ error: 'Eksik parametre: type, segment, goal zorunlu.' }, { status: 400 })
    }

    const result = await generateCampaign({ type, segment, goal, storeName: storeName || 'Mağazam', productCategory, tone })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('[AI Campaign]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
