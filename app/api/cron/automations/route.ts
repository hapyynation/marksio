import { NextRequest, NextResponse } from 'next/server'

const AUTOMATION_RUN_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/automations/run`
  : 'http://localhost:3001/api/automations/run'

// Vercel Cron: GET /api/cron/automations
// vercel.json schedule: "*/15 * * * *" (her 15 dakikada bir)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron kendi CRON_SECRET'ini header'a koyar,
  // ya da doğrudan Vercel internal call olduğundan bearer ile kontrol et.
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch(AUTOMATION_RUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret ?? ''}`,
      },
    })

    const data = await res.json()
    return NextResponse.json({ ok: true, ...data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
