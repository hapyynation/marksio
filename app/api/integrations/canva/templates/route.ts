import { getApiSession } from '@/lib/auth'
import { getValidAccessToken, listBrandTemplates } from '@/lib/canva'

export async function GET() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const token = await getValidAccessToken(session.user.id)
  if (!token) return Response.json({ connected: false, templates: [] })

  try {
    const data = await listBrandTemplates(token)
    return Response.json({ connected: true, templates: data.items ?? [] })
  } catch {
    return Response.json({ connected: true, templates: [], error: 'template_fetch_failed' })
  }
}
