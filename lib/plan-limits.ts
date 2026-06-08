export type PlanId = 'free' | 'starter' | 'growth' | 'agency'

export interface PlanLimits {
  emailSendsPerMonth: number  // -1 = unlimited
  automations: number
  whatsappSends: number
  segments: number
  campaigns: number
  aiStudio: boolean
  teamMembers: number
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    emailSendsPerMonth: 1000,
    automations: 0,
    whatsappSends: 0,
    segments: 3,
    campaigns: 5,
    aiStudio: false,
    teamMembers: 1,
  },
  starter: {
    emailSendsPerMonth: 10000,
    automations: 3,
    whatsappSends: 1000,
    segments: 10,
    campaigns: 20,
    aiStudio: true,
    teamMembers: 3,
  },
  growth: {
    emailSendsPerMonth: 50000,
    automations: 20,
    whatsappSends: 10000,
    segments: 50,
    campaigns: -1,
    aiStudio: true,
    teamMembers: 10,
  },
  agency: {
    emailSendsPerMonth: -1,
    automations: -1,
    whatsappSends: -1,
    segments: -1,
    campaigns: -1,
    aiStudio: true,
    teamMembers: -1,
  },
}

/** Returns limits for a plan, defaulting to free for unknown plans. */
export function getLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanId] ?? PLAN_LIMITS.free
}

/** True when the limit is reached. limit === -1 means unlimited. */
export function isAtLimit(current: number, limit: number): boolean {
  if (limit === -1) return false
  return current >= limit
}

/** Returns the next plan tier above currentPlan. */
export function getUpgradePlan(currentPlan: string): PlanId {
  const order: PlanId[] = ['free', 'starter', 'growth', 'agency']
  const idx = order.indexOf(currentPlan as PlanId)
  if (idx === -1 || idx >= order.length - 1) return 'agency'
  return order[idx + 1]
}

/** Effective plan after accounting for non-active subscription status. */
export function getEffectivePlan(plan: string, planStatus: string): string {
  if (planStatus === 'expired' || planStatus === 'past_due') return 'free'
  return plan
}
