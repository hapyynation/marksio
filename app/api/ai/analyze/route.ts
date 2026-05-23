import { NextRequest, NextResponse } from 'next/server'
import { analyzeSegments } from '@/lib/claude'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await analyzeSegments(body)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
