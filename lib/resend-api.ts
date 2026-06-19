const RESEND_API = 'https://api.resend.com'

function key(): string {
  return process.env.RESEND_API_KEY ?? ''
}

function headers(extra?: Record<string, string>) {
  return { Authorization: `Bearer ${key()}`, ...extra }
}

export async function getResendDomains() {
  const res = await fetch(`${RESEND_API}/domains`, { headers: headers() })
  return res.json()
}

export async function getResendDomain(domainId: string) {
  const res = await fetch(`${RESEND_API}/domains/${domainId}`, { headers: headers() })
  return res.json()
}

export async function verifyResendDomain(domainId: string) {
  const res = await fetch(`${RESEND_API}/domains/${domainId}/verify`, {
    method: 'POST',
    headers: headers(),
  })
  return res.json()
}

export async function createResendDomain(name: string) {
  const res = await fetch(`${RESEND_API}/domains`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function deleteResendDomain(domainId: string): Promise<boolean> {
  const res = await fetch(`${RESEND_API}/domains/${domainId}`, {
    method: 'DELETE',
    headers: headers(),
  })
  return res.ok
}

export function calculateHealthScore(metrics: {
  bounceRate: number
  complaintRate: number
  openRate: number
  deliveryRate: number
}): { score: number; status: 'good' | 'warning' | 'danger' } {
  let score = 100

  if (metrics.bounceRate > 5) score -= 40
  else if (metrics.bounceRate > 2) score -= 20
  else if (metrics.bounceRate > 1) score -= 10

  if (metrics.complaintRate > 0.1) score -= 35
  else if (metrics.complaintRate > 0.05) score -= 20
  else if (metrics.complaintRate > 0.02) score -= 10

  if (metrics.openRate > 30) score += 5
  else if (metrics.openRate < 10) score -= 10

  if (metrics.deliveryRate < 95) score -= 15
  else if (metrics.deliveryRate < 98) score -= 5

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    status: score >= 70 ? 'good' : score >= 40 ? 'warning' : 'danger',
  }
}
