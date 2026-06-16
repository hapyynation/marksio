import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

// GET /tracker.js?store_id=xxx
// public/tracker.js'i okur, {{STORE_ID}} placeholder'ını değiştirir ve JS olarak döner
export async function GET(req: NextRequest) {
  const storeId = req.nextUrl.searchParams.get('store_id') ?? ''

  try {
    const filePath = join(process.cwd(), 'public', 'tracker.js')
    const source = readFileSync(filePath, 'utf8')
    const script = source.replace(/\{\{STORE_ID\}\}/g, storeId)

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return new NextResponse('// tracker unavailable', {
      headers: { 'Content-Type': 'application/javascript' },
    })
  }
}
