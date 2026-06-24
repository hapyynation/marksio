import { prisma } from '@/lib/prisma'
import { randomBytes, createHash } from 'crypto'

const CANVA_API = 'https://api.canva.com/rest/v1'
const CLIENT_ID = process.env.CANVA_CLIENT_ID!
const CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET!
const REDIRECT_URI = process.env.CANVA_REDIRECT_URI!

export const CANVA_SCOPES = [
  'asset:read', 'asset:write',
  'brandtemplate:content:read', 'brandtemplate:meta:read',
  'design:content:read', 'design:content:write',
  'design:meta:read',
  'profile:read',
].join(' ')

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function getCanvaAuthUrl(state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: CANVA_SCOPES,
    state,
    code_challenge_method: 's256',
    code_challenge: codeChallenge,
  })
  return `https://www.canva.com/api/oauth/authorize?${params}`
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) throw new Error(`Canva token exchange failed: ${await res.text()}`)
  return res.json()
}

async function refreshToken(refreshTok: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(`${CANVA_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTok,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  })
  if (!res.ok) throw new Error(`Canva token refresh failed: ${await res.text()}`)
  return res.json()
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.integration.findFirst({
    where: { platform: 'canva', userId },
    orderBy: { updatedAt: 'desc' },
  })
  if (!integration?.accessToken) return null

  const meta = JSON.parse(integration.meta || '{}')
  const expiresAt: number = meta.expiresAt ?? 0
  const now = Date.now()

  if (now < expiresAt - 60_000) return integration.accessToken

  if (!integration.apiSecret) return null
  const tokens = await refreshToken(integration.apiSecret)
  await prisma.integration.update({
    where: { id: integration.id },
    data: {
      accessToken: tokens.access_token,
      apiSecret: tokens.refresh_token,
      meta: JSON.stringify({ expiresAt: now + tokens.expires_in * 1000 }),
    },
  })
  return tokens.access_token
}

export async function saveCanvaTokens(
  userId: string,
  accessToken: string,
  refreshTok: string,
  expiresIn: number,
) {
  const expiresAt = Date.now() + expiresIn * 1000
  await prisma.integration.upsert({
    where: { userId_platform: { userId, platform: 'canva' } },
    update: {
      accessToken,
      apiSecret: refreshTok,
      status: 'active',
      meta: JSON.stringify({ expiresAt }),
    },
    create: {
      userId,
      platform: 'canva',
      accessToken,
      apiSecret: refreshTok,
      status: 'active',
      meta: JSON.stringify({ expiresAt }),
    },
  })
}

async function canvaFetch(path: string, options: RequestInit = {}, accessToken: string) {
  const res = await fetch(`${CANVA_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Canva API ${path} failed (${res.status}): ${body}`)
  }
  return res.json()
}

export async function listBrandTemplates(accessToken: string) {
  return canvaFetch('/brand-templates?limit=50', {}, accessToken)
}

export interface AutofillData {
  [field: string]: { type: 'text'; text: string } | { type: 'image'; asset_id: string }
}

export async function createAutofillJob(
  accessToken: string,
  brandTemplateId: string,
  data: AutofillData,
): Promise<string> {
  const body = await canvaFetch('/autofills', {
    method: 'POST',
    body: JSON.stringify({ brand_template_id: brandTemplateId, data }),
  }, accessToken)
  return body.job.id
}

export async function pollAutofillJob(
  accessToken: string,
  jobId: string,
  maxAttempts = 20,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1500))
    const body = await canvaFetch(`/autofills/${jobId}`, {}, accessToken)
    const job = body.job
    if (job.status === 'success') return job.result.design.id
    if (job.status === 'failed') throw new Error('Canva autofill job failed')
  }
  throw new Error('Canva autofill job timed out')
}

export async function createExportJob(
  accessToken: string,
  designId: string,
): Promise<string> {
  const body = await canvaFetch('/exports', {
    method: 'POST',
    body: JSON.stringify({
      design_id: designId,
      format: 'png',
      export_quality: 'pro',
    }),
  }, accessToken)
  return body.job.id
}

export async function pollExportJob(
  accessToken: string,
  exportJobId: string,
  maxAttempts = 20,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 1500))
    const body = await canvaFetch(`/exports/${exportJobId}`, {}, accessToken)
    const job = body.job
    if (job.status === 'success') return job.urls[0]
    if (job.status === 'failed') throw new Error('Canva export job failed')
  }
  throw new Error('Canva export job timed out')
}
