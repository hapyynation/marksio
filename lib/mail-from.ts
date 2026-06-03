// Returns the correct "From" address for outgoing emails.
// Custom per-user domains are not yet active in production — Resend free plan
// supports a single domain (mg.marksio.com). All sending goes through the
// system address until multi-domain support is enabled.
export function getFromAddress(storeName: string, _verifiedDomain?: string | null): string {
  const systemEmail = process.env.SYSTEM_FROM_EMAIL ?? 'noreply@mg.marksio.com'
  const systemName  = process.env.SYSTEM_SENDER_NAME ?? storeName
  return `${systemName} <${systemEmail}>`
}

export function getSystemFromAddress(displayName?: string): string {
  const systemEmail = process.env.SYSTEM_FROM_EMAIL ?? 'noreply@mg.marksio.com'
  const systemName  = displayName ?? process.env.SYSTEM_SENDER_NAME ?? 'Marksio'
  return `${systemName} <${systemEmail}>`
}
