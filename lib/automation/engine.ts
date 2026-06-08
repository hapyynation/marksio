/**
 * Automation Execution Engine
 *
 * startRun(automationId, customerId, triggerData)
 *   → AutomationRun oluştur → executeRun()
 *
 * executeRun(runId)
 *   → currentNode'u çalıştır → next node'a geç → tekrar et
 *   → WaitNode → status='waiting', resumeAt set
 *   → StopNode  → status='completed'
 *
 * resumeWaitingRuns()
 *   → resumeAt <= now olan run'ları bul → executeRun()
 */

import { prisma } from '@/lib/prisma'
import {
  execTrigger, execWait, execStop, execCondition, execSplitTest,
  execSendEmail, execSendWhatsApp,
  execAddTag, execRemoveTag, execMoveSegment, execWebhook,
  safeParseJson, type RunCtx, type NodeResult,
} from './node-executors'

/* ─────────────────────────────────────────────────────────────
   FLOW TYPES (ReactFlow format)
───────────────────────────────────────────────────────────── */

type FlowNode = {
  id:   string
  type: string
  data: Record<string, unknown>
}
type FlowEdge = {
  id:           string
  source:       string
  target:       string
  sourceHandle?: string
}
type FlowData = { nodes: FlowNode[]; edges: FlowEdge[] }

/* ─────────────────────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────────────────────── */

/**
 * Yeni bir otomasyon çalışması başlat.
 * Aynı otomasyon + müşteri için zaten aktif bir run varsa skip eder.
 */
export async function startRun(
  automationId: string,
  customerId: string,
  triggerData: Record<string, unknown> = {},
): Promise<{ runId: string; skipped?: boolean }> {
  const automation = await prisma.automation.findUnique({ where: { id: automationId } })
  if (!automation) throw new Error(`Automation not found: ${automationId}`)

  const flow = parseFlow(automation.flowData)
  if (!flow) throw new Error('Invalid flowData in automation')

  const triggerNode = flow.nodes.find(n => n.type === 'triggerNode')
  if (!triggerNode) throw new Error('No triggerNode found in flow')

  /* Dedup: aynı müşteri + otomasyon için aktif run varsa yeni başlatma */
  const existing = await prisma.automationRun.findFirst({
    where: { automationId, customerId, status: { in: ['running', 'waiting'] } },
  })
  if (existing) {
    return { runId: existing.id, skipped: true }
  }

  const ctx: RunCtx = { triggerData, vars: {} }
  const run = await prisma.automationRun.create({
    data: {
      automationId,
      userId: automation.userId,
      customerId,
      status: 'running',
      currentNodeId: triggerNode.id,
      context: JSON.stringify(ctx),
    },
  })

  await addLog(run.id, automationId, automation.userId, customerId, 'info',
    `Run başladı — trigger: ${automation.trigger}`)

  await executeRun(run.id)
  return { runId: run.id }
}

/**
 * resumeAt süresi dolmuş tüm 'waiting' run'ları ilerlet.
 * Cron job'dan çağrılır.
 */
export async function resumeWaitingRuns(userId?: string): Promise<number> {
  const where = {
    status: 'waiting' as const,
    resumeAt: { lte: new Date() },
    ...(userId ? { userId } : {}),
  }

  const runs = await prisma.automationRun.findMany({ where, take: 50 })
  let count = 0

  for (const run of runs) {
    try {
      await prisma.automationRun.update({
        where: { id: run.id },
        data:  { status: 'running', resumeAt: null },
      })
      await executeRun(run.id)
      count++
    } catch (err) {
      await failRun(run.id, run.automationId, run.userId, run.customerId, String(err))
    }
  }
  return count
}

/* ─────────────────────────────────────────────────────────────
   CORE EXECUTOR
───────────────────────────────────────────────────────────── */

const MAX_DEPTH = 50

async function executeRun(runId: string, depth = 0): Promise<void> {
  if (depth > MAX_DEPTH) throw new Error('Max execution depth exceeded')

  const run = await prisma.automationRun.findUnique({
    where:   { id: runId },
    include: { automation: true },
  })
  if (!run || run.status === 'completed' || run.status === 'failed') return

  const flow = parseFlow(run.automation.flowData)
  if (!flow) { await failRun(runId, run.automationId, run.userId, run.customerId, 'Invalid flowData'); return }

  const node = flow.nodes.find(n => n.id === run.currentNodeId)
  if (!node) {
    /* No more nodes — run is done */
    await completeRun(runId, run.automationId, run.userId, run.customerId)
    return
  }

  const ctx: RunCtx = safeParseJson(run.context, { triggerData: {}, vars: {} })

  /* ── Create step record ──────────────────────────────────── */
  const step = await prisma.automationRunStep.create({
    data: {
      runId,
      nodeId:    node.id,
      nodeType:  node.type,
      nodeLabel: String(node.data?.title ?? node.type),
      status:    'running',
      startedAt: new Date(),
      input:     JSON.stringify({ config: node.data?.config ?? {}, ctx }),
    },
  })

  /* ── Execute node ────────────────────────────────────────── */
  let result: NodeResult
  try {
    result = await dispatchNode(node, run.customerId, run.userId, run.automationId, ctx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await prisma.automationRunStep.update({
      where: { id: step.id },
      data:  { status: 'failed', error: msg, endedAt: new Date() },
    })
    await addLog(runId, run.automationId, run.userId, run.customerId, 'error', `Node hatası [${node.type}]: ${msg}`)
    await failRun(runId, run.automationId, run.userId, run.customerId, msg)
    return
  }

  /* ── Update step ─────────────────────────────────────────── */
  await prisma.automationRunStep.update({
    where: { id: step.id },
    data:  {
      status:  result.pause ? 'waiting' : 'completed',
      output:  JSON.stringify(result.output),
      endedAt: new Date(),
    },
  })

  /* ── Handle special results ──────────────────────────────── */

  if (result.stop) {
    await addLog(runId, run.automationId, run.userId, run.customerId, 'info', 'Akış tamamlandı (stop node)')
    await completeRun(runId, run.automationId, run.userId, run.customerId)
    return
  }

  if (result.pause && result.resumeAt) {
    /* Advance currentNodeId to the NEXT node before pausing,
       so resume picks up after the wait node, not re-running it. */
    const resumeNextId = getNextNodeId(node.id, flow, result.branch)
    await prisma.automationRun.update({
      where: { id: runId },
      data:  {
        status: 'waiting',
        resumeAt: result.resumeAt,
        currentNodeId: resumeNextId,   // <-- key fix
      },
    })
    await addLog(runId, run.automationId, run.userId, run.customerId, 'info',
      `Bekleniyor: ${result.pauseLabel ?? ''} — devam: ${result.resumeAt.toISOString()}`)
    return
  }

  /* ── Advance to next node ────────────────────────────────── */
  const nextId = getNextNodeId(node.id, flow, result.branch)
  if (!nextId) {
    await completeRun(runId, run.automationId, run.userId, run.customerId)
    return
  }

  const newCtx: RunCtx = { ...ctx, vars: { ...ctx.vars, ...(result.vars ?? {}) } }
  await prisma.automationRun.update({
    where: { id: runId },
    data:  { currentNodeId: nextId, context: JSON.stringify(newCtx) },
  })

  await executeRun(runId, depth + 1)
}

/* ─────────────────────────────────────────────────────────────
   NODE DISPATCHER
───────────────────────────────────────────────────────────── */

async function dispatchNode(
  node:         FlowNode,
  customerId:   string,
  userId:       string,
  automationId: string,
  ctx:          RunCtx,
): Promise<NodeResult> {
  const d: Record<string, unknown> = { ...node.data, automationId }

  switch (node.type) {
    case 'triggerNode':   return execTrigger()
    case 'stopNode':      return execStop()
    case 'waitNode':      return execWait(d)
    case 'conditionNode': return execCondition(d, customerId)
    case 'splitTestNode': return execSplitTest(d)

    case 'actionNode': {
      const at = String(d.actionType ?? '')
      switch (at) {
        case 'send_email':    return execSendEmail(d, customerId, userId, ctx)
        case 'send_whatsapp': return execSendWhatsApp(d, customerId, userId, ctx)
        case 'add_tag':       return execAddTag(d, customerId)
        case 'remove_tag':    return execRemoveTag(d, customerId)
        case 'move_segment':  return execMoveSegment(d, customerId)
        case 'webhook':       return execWebhook(d, customerId, ctx)
        default:
          return { output: { skipped: `unknown actionType: ${at}` } }
      }
    }

    default:
      return { output: { skipped: `unknown nodeType: ${node.type}` } }
  }
}

/* ─────────────────────────────────────────────────────────────
   GRAPH TRAVERSAL
───────────────────────────────────────────────────────────── */

function getNextNodeId(nodeId: string, flow: FlowData, branch?: string): string | null {
  const outEdges = flow.edges.filter(e => e.source === nodeId)
  if (outEdges.length === 0) return null

  if (branch) {
    const match = outEdges.find(e => e.sourceHandle === branch)
    return match?.target ?? outEdges[0]?.target ?? null
  }
  return outEdges[0]?.target ?? null
}

/* ─────────────────────────────────────────────────────────────
   RUN LIFECYCLE HELPERS
───────────────────────────────────────────────────────────── */

async function completeRun(runId: string, automationId: string, userId: string, customerId: string) {
  await prisma.automationRun.update({
    where: { id: runId },
    data:  { status: 'completed', completedAt: new Date(), currentNodeId: null },
  })
  await addLog(runId, automationId, userId, customerId, 'info', 'Run tamamlandı')
}

async function failRun(runId: string, automationId: string, userId: string, customerId: string, reason: string) {
  await prisma.automationRun.update({
    where: { id: runId },
    data:  { status: 'failed', failedAt: new Date(), failReason: reason },
  })
  await addLog(runId, automationId, userId, customerId, 'error', `Run başarısız: ${reason}`)
}

async function addLog(
  runId: string, automationId: string, userId: string, customerId: string,
  level: 'info' | 'warn' | 'error', message: string, data?: unknown,
) {
  await prisma.automationLog.create({
    data: { runId, automationId, userId, customerId, level, message, data: JSON.stringify(data ?? {}) },
  })
}

/* ─────────────────────────────────────────────────────────────
   RETRY: re-run a failed AutomationRun from scratch
───────────────────────────────────────────────────────────── */

export async function retryRun(runId: string): Promise<{ newRunId: string }> {
  const oldRun = await prisma.automationRun.findUnique({ where: { id: runId } })
  if (!oldRun) throw new Error(`Run not found: ${runId}`)
  if (!['failed', 'stopped'].includes(oldRun.status)) throw new Error('Only failed/stopped runs can be retried')

  const ctx = safeParseJson<RunCtx>(oldRun.context, { triggerData: {}, vars: {} })

  /* Remove the failed run's dedup block so startRun doesn't skip */
  await prisma.automationRun.update({ where: { id: runId }, data: { status: 'stopped' } })

  const { runId: newRunId } = await startRun(oldRun.automationId, oldRun.customerId, ctx.triggerData)
  return { newRunId }
}

/* ─────────────────────────────────────────────────────────────
   TARGETED: fire automations for a single CustomerEvent
   Used by webhook handlers for immediate, low-latency triggering.
───────────────────────────────────────────────────────────── */

export async function triggerAutomationsForEvent(event: {
  id: string
  userId: string
  customerId: string
  type: string
  data: string
}): Promise<number> {
  const automations = await prisma.automation.findMany({
    where: { userId: event.userId, status: 'active', trigger: event.type },
  })

  let count = 0
  for (const automation of automations) {
    try {
      const result = await startRun(automation.id, event.customerId, safeParseJson(event.data, {}))
      if (!result.skipped) count++
    } catch (err) {
      console.error(`[Engine] triggerAutomationsForEvent [${automation.id}]:`, err)
    }
  }

  await prisma.customerEvent.update({
    where: { id: event.id },
    data: { processedAt: new Date() },
  })

  return count
}

/* ─────────────────────────────────────────────────────────────
   BATCH: unprocessed CustomerEvents → start matching runs
───────────────────────────────────────────────────────────── */

export async function processUnhandledEvents(userId?: string): Promise<number> {
  const events = await prisma.customerEvent.findMany({
    where: { processedAt: null, ...(userId ? { userId } : {}) },
    include: { customer: true },
    take: 100,
    orderBy: { createdAt: 'asc' },
  })

  let count = 0

  for (const event of events) {
    const automations = await prisma.automation.findMany({
      where: { userId: event.userId, status: 'active', trigger: event.type },
    })

    for (const automation of automations) {
      try {
        await startRun(automation.id, event.customerId, safeParseJson(event.data, {}))
        count++
      } catch (err) {
        console.error(`processUnhandledEvents error [${automation.id}]:`, err)
      }
    }

    await prisma.customerEvent.update({
      where: { id: event.id },
      data: { processedAt: new Date() },
    })
  }

  return count
}

/* ─────────────────────────────────────────────────────────────
   CRON: time-based triggers (customer_inactive, birthday)
───────────────────────────────────────────────────────────── */

export async function scanTimedTriggers(): Promise<number> {
  let count = 0

  /* ── customer_inactive ─────────────────────────────────── */
  const inactiveAutomations = await prisma.automation.findMany({
    where: { status: 'active', trigger: 'customer_inactive' },
  })

  for (const automation of inactiveAutomations) {
    const cfg = safeParseJson(automation.triggerConfig, {} as Record<string, unknown>)
    const days = Number(cfg.inactiveDays ?? 30)
    const cutoff = new Date(Date.now() - days * 86_400_000)

    const candidates = await prisma.customer.findMany({
      where: {
        userId: automation.userId,
        OR: [
          { lastOrder: { lt: cutoff } },
          { lastOrder: null, createdAt: { lt: cutoff } },
        ],
      },
      take: 100,
    })

    for (const customer of candidates) {
      /* Don't re-run if already completed within the past `days` days */
      const lastRun = await prisma.automationRun.findFirst({
        where: { automationId: automation.id, customerId: customer.id, status: 'completed' },
        orderBy: { completedAt: 'desc' },
      })
      if (lastRun?.completedAt && new Date(lastRun.completedAt) > cutoff) continue

      /* Skip if currently active */
      const active = await prisma.automationRun.findFirst({
        where: { automationId: automation.id, customerId: customer.id, status: { in: ['running', 'waiting'] } },
      })
      if (active) continue

      try {
        await startRun(automation.id, customer.id, { inactiveDays: days })
        count++
      } catch (err) {
        console.error(`scanTimedTriggers [customer_inactive]:`, err)
      }
    }
  }

  /* ── birthday ──────────────────────────────────────────────
     Requires Customer.birthdayMonth / birthdayDay fields.
     Stored as JSON in future schema. Skipped until field added.
  ─────────────────────────────────────────────────────────── */

  return count
}

/* ─────────────────────────────────────────────────────────────
   PARSE HELPERS
───────────────────────────────────────────────────────────── */

function parseFlow(raw: string): FlowData | null {
  try {
    const d = JSON.parse(raw)
    if (Array.isArray(d?.nodes) && Array.isArray(d?.edges)) return d as FlowData
    return null
  } catch { return null }
}
