/**
 * Automation Runtime — Gerçek Entegrasyon Testi
 * Çalıştır: npx tsx scripts/test-automation-runtime.ts
 */

import { PrismaClient } from '@prisma/client'
import { startRun, resumeWaitingRuns } from '../lib/automation/engine'

const prisma = new PrismaClient()

const USER_ID     = 'cmpi1atxy00009jk02rqdjjyo'
const CUSTOMER_ID = 'cmpi1avrt00089jk0wbfy7k2x'

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const ok   = (m: string) => console.log(`  ✅ ${m}`)
const fail = (m: string) => console.log(`  ❌ ${m}`)
const info = (m: string) => console.log(`  ℹ️  ${m}`)
const sep  = (m: string) => console.log(`\n${'─'.repeat(62)}\n  ${m}\n${'─'.repeat(62)}`)

async function cleanup(id: string) {
  await prisma.automationLog.deleteMany({ where: { automationId: id } })
  await prisma.automationRunStep.deleteMany({ where: { run: { automationId: id } } })
  await prisma.automationRun.deleteMany({ where: { automationId: id } })
  await prisma.automation.delete({ where: { id } }).catch(() => {})
}

/* ─────────────────────────────────────────────────────────────
   SENARYO 1: new_customer → wait(1dk) → email → add_tag → stop
───────────────────────────────────────────────────────────── */

async function scenario1() {
  sep('SENARYO 1: new_customer → wait(1dk) → email → tag → stop')

  const flowData = {
    nodes: [
      { id: 'n1', type: 'triggerNode', position: { x: 0, y: 0 },
        data: { triggerType: 'new_customer', type: 'new_customer', title: 'Yeni Müşteri', config: {}, stats: {} } },
      { id: 'n2', type: 'waitNode', position: { x: 0, y: 120 },
        data: { type: 'wait', title: '1 Dakika Bekle', delayAmount: 1, delayUnit: 'minutes', config: {}, stats: {} } },
      { id: 'n3', type: 'actionNode', position: { x: 0, y: 240 },
        data: { actionType: 'send_email', type: 'send_email', title: 'Hoş Geldin Emaili',
          config: { subject: 'Hoş geldiniz {{firstName}}!', body: 'Merhaba {{firstName}}, mağazamıza hoş geldiniz.', senderName: 'ModaKara' }, stats: {} } },
      { id: 'n4', type: 'actionNode', position: { x: 0, y: 360 },
        data: { actionType: 'add_tag', type: 'add_tag', title: 'Hoşgeldin Etiketi',
          config: { tag: 'test-hosgeldin-akisi' }, stats: {} } },
      { id: 'n5', type: 'stopNode', position: { x: 0, y: 480 },
        data: { type: 'stop', title: 'Bitti', config: {}, stats: {} } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out' },
      { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'out' },
      { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'out' },
      { id: 'e4', source: 'n4', target: 'n5', sourceHandle: 'out' },
    ],
  }

  const auto = await prisma.automation.create({
    data: { userId: USER_ID, name: '[TEST] Hoşgeldin Akışı', trigger: 'new_customer',
            status: 'active', flowData: JSON.stringify(flowData) },
  })
  info(`Automation oluşturuldu: ${auto.id}`)

  // --- PHASE 1: startRun ---
  const { runId } = await startRun(auto.id, CUSTOMER_ID, { source: 'test' })
  info(`startRun() → runId: ${runId}`)

  const run1 = await prisma.automationRun.findUnique({ where: { id: runId } })
  if (!run1) { fail('AutomationRun oluşturulmadı!'); return await cleanup(auto.id) }
  ok(`AutomationRun oluşturuldu — status: ${run1.status}`)

  const steps1 = await prisma.automationRunStep.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })
  const logs1  = await prisma.automationLog.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })

  ok(`AutomationRunStep sayısı: ${steps1.length}`)
  ok(`AutomationLog sayısı: ${logs1.length}`)

  for (const s of steps1) {
    const icon = { completed: '✅', waiting: '⏳', failed: '❌', running: '🔄' }[s.status] ?? '⬜'
    console.log(`     ${icon} [${s.nodeType}] "${s.nodeLabel}" — status: ${s.status}`)
    if (s.output !== '{}') console.log(`        output: ${s.output.slice(0, 100)}`)
    if (s.error)           console.log(`        error: ${s.error.slice(0, 80)}`)
  }

  // Wait node doğrula
  if (run1.status === 'waiting') {
    ok(`Wait node çalıştı → run.status=waiting, resumeAt: ${run1.resumeAt?.toISOString()}`)

    // --- PHASE 2: Wait geçti, resume ---
    info('Wait simülasyonu: resumeAt geçmişe alınıyor...')
    await prisma.automationRun.update({
      where: { id: runId },
      data:  { resumeAt: new Date(Date.now() - 1000) },
    })

    const resumed = await resumeWaitingRuns()
    ok(`resumeWaitingRuns() → ${resumed} run devam etti`)

    const run2    = await prisma.automationRun.findUnique({ where: { id: runId } })
    const steps2  = await prisma.automationRunStep.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })
    const logs2   = await prisma.automationLog.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })

    console.log('\n  📊 PHASE 2 — Resume sonrası:')
    info(`Run final status: ${run2?.status}`)
    info(`Toplam step: ${steps2.length} | Toplam log: ${logs2.length}`)

    for (const s of steps2) {
      const icon = { completed: '✅', waiting: '⏳', failed: '❌', running: '🔄' }[s.status] ?? '⬜'
      console.log(`     ${icon} [${s.nodeType}] "${s.nodeLabel}" — ${s.status}`)
      if (s.output !== '{}') console.log(`        output: ${s.output.slice(0, 120)}`)
      if (s.error)           console.log(`        error: ${s.error.slice(0, 100)}`)
    }

    console.log('\n  📋 Loglar:')
    for (const l of logs2) {
      const icon = { error: '🔴', warn: '🟡', info: '🟢' }[l.level] ?? '⬜'
      console.log(`     ${icon} [${l.level}] ${l.message}`)
    }

    // Tag eklendi mi?
    const customer = await prisma.customer.findUnique({ where: { id: CUSTOMER_ID } })
    const tags: string[] = JSON.parse(customer?.tags ?? '[]')
    if (tags.includes('test-hosgeldin-akisi')) {
      ok(`Tag eklendi ✓ — customer.tags: ${JSON.stringify(tags)}`)
      // Temizle
      const filtered = tags.filter(t => t !== 'test-hosgeldin-akisi')
      await prisma.customer.update({ where: { id: CUSTOMER_ID }, data: { tags: JSON.stringify(filtered) } })
    } else {
      info(`Tag bulunamadı (email hatası olmuş olabilir) — tags: ${JSON.stringify(tags)}`)
    }

    if (run2?.status === 'completed') ok('Run başarıyla tamamlandı ✓')
    else if (run2?.status === 'failed') info(`Run failed — reason: ${run2?.failReason}`)

  } else {
    fail(`Beklenen status=waiting, alınan: ${run1.status}`)
  }

  await cleanup(auto.id)
  info('Test verisi temizlendi')
}

/* ─────────────────────────────────────────────────────────────
   SENARYO 2: product_viewed → condition(purchased) → branch test
───────────────────────────────────────────────────────────── */

async function scenario2() {
  sep('SENARYO 2: product_viewed → condition(purchased?) → YES:WA / NO:Email')

  const flowData = {
    nodes: [
      { id: 'n1', type: 'triggerNode', position: { x: 0, y: 0 },
        data: { triggerType: 'product_viewed', type: 'product_viewed', title: 'Ürün Görüntülendi', config: {}, stats: {} } },
      { id: 'n2', type: 'conditionNode', position: { x: 0, y: 120 },
        data: { type: 'condition', title: 'Daha Önce Satın Aldı mı?', condition: 'purchased', config: {}, stats: {} } },
      { id: 'n3', type: 'actionNode', position: { x: -150, y: 280 },
        data: { actionType: 'send_whatsapp', type: 'send_whatsapp', title: 'WhatsApp - Mevcut Müşteri',
          config: { message: 'Merhaba {{firstName}}, ilgilendiğin ürünü sana özel fiyatla sunuyoruz 🎁' }, stats: {} } },
      { id: 'n4', type: 'actionNode', position: { x: 150, y: 280 },
        data: { actionType: 'send_email', type: 'send_email', title: 'Email - Yeni Müşteri',
          config: { subject: 'İncelediğiniz ürün sizi bekliyor', body: 'Merhaba {{firstName}}, ürünü sepetinize eklediniz mi?', senderName: 'ModaKara' }, stats: {} } },
      { id: 'n5', type: 'stopNode', position: { x: -150, y: 440 },
        data: { type: 'stop', title: 'WA Sonrası Bitti', config: {}, stats: {} } },
      { id: 'n6', type: 'stopNode', position: { x: 150, y: 440 },
        data: { type: 'stop', title: 'Email Sonrası Bitti', config: {}, stats: {} } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out'  },
      { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'yes' },
      { id: 'e3', source: 'n2', target: 'n4', sourceHandle: 'no'  },
      { id: 'e4', source: 'n3', target: 'n5', sourceHandle: 'out'  },
      { id: 'e5', source: 'n4', target: 'n6', sourceHandle: 'out'  },
    ],
  }

  const auto = await prisma.automation.create({
    data: { userId: USER_ID, name: '[TEST] Condition Branching', trigger: 'product_viewed',
            status: 'active', flowData: JSON.stringify(flowData) },
  })

  /* ── Test A: Siparişi olan müşteri (totalOrders=12) → EVET branch ── */
  info('Test A — Alışveriş yapmış müşteri (totalOrders=12) → EVET branch bekleniyor')
  const { runId: runA } = await startRun(auto.id, CUSTOMER_ID, { productId: 'prod_abc' })
  const stepsA = await prisma.automationRunStep.findMany({ where: { runId: runA }, orderBy: { createdAt: 'asc' } })
  const condA  = stepsA.find(s => s.nodeType === 'conditionNode')
  const outA   = JSON.parse(condA?.output ?? '{}') as { condition: string; result: boolean; branch: string }
  console.log(`\n  Condition eval: condition="${outA.condition}" result=${outA.result} → branch=${outA.branch}`)

  const chainA = stepsA.map(s => s.nodeLabel ?? s.nodeType).join(' → ')
  info(`Node chain: ${chainA}`)

  if (outA.branch === 'yes') {
    ok('Condition doğru: branch=YES ✓')
    const waStep = stepsA.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('WhatsApp'))
    const emailStep = stepsA.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('Email'))
    if (waStep)    ok(`WhatsApp node çalıştı (${waStep.status}) — output: ${waStep.output}`)
    if (!emailStep) ok('Email node ÇALIŞMADI (doğru — HAYIR branch\'indeydi) ✓')
  } else {
    fail(`Beklenen branch=yes, alınan: ${outA.branch}`)
  }

  /* ── Test B: Siparişsiz müşteri → HAYIR branch ── */
  info('\nTest B — Siparişsiz müşteri → HAYIR branch bekleniyor')
  const noOrderCustomer = await prisma.customer.create({
    data: { userId: USER_ID, name: 'Test Siparişsiz', email: `testno_${Date.now()}@test.com`,
            totalOrders: 0, totalSpent: 0 },
  })

  const { runId: runB } = await startRun(auto.id, noOrderCustomer.id, { productId: 'prod_xyz' })
  const stepsB = await prisma.automationRunStep.findMany({ where: { runId: runB }, orderBy: { createdAt: 'asc' } })
  const condB  = stepsB.find(s => s.nodeType === 'conditionNode')
  const outB   = JSON.parse(condB?.output ?? '{}') as { condition: string; result: boolean; branch: string }
  console.log(`\n  Condition eval: condition="${outB.condition}" result=${outB.result} → branch=${outB.branch}`)

  const chainB = stepsB.map(s => s.nodeLabel ?? s.nodeType).join(' → ')
  info(`Node chain: ${chainB}`)

  if (outB.branch === 'no') {
    ok('Condition doğru: branch=NO ✓')
    const emailStep = stepsB.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('Email'))
    const waStep    = stepsB.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('WhatsApp'))
    if (emailStep) ok(`Email node çalıştı (${emailStep.status}) — output: ${emailStep.output}`)
    if (!waStep)   ok('WhatsApp node ÇALIŞMADI (doğru — EVET branch\'indeydi) ✓')
  } else {
    fail(`Beklenen branch=no, alınan: ${outB.branch}`)
  }

  // Temizlik
  await prisma.automationRunStep.deleteMany({ where: { run: { customerId: noOrderCustomer.id } } })
  await prisma.automationRun.deleteMany({ where: { customerId: noOrderCustomer.id } })
  await prisma.automationLog.deleteMany({ where: { customerId: noOrderCustomer.id } })
  await prisma.customer.delete({ where: { id: noOrderCustomer.id } })
  await cleanup(auto.id)
  info('Test verisi temizlendi')
}

/* ─────────────────────────────────────────────────────────────
   SENARYO 3: Hata loglama — geçersiz webhook
───────────────────────────────────────────────────────────── */

async function scenario3() {
  sep('SENARYO 3: Hata loglama — geçersiz webhook URL')

  const flowData = {
    nodes: [
      { id: 'n1', type: 'triggerNode', position: { x: 0, y: 0 },
        data: { triggerType: 'manual_trigger', type: 'manual_trigger', title: 'Manuel', config: {}, stats: {} } },
      { id: 'n2', type: 'actionNode', position: { x: 0, y: 120 },
        data: { actionType: 'webhook', type: 'webhook', title: 'Hatalı Webhook',
          config: { url: 'http://10.0.0.1:9999/timeout', method: 'POST' }, stats: {} } },
    ],
    edges: [{ id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out' }],
  }

  const auto = await prisma.automation.create({
    data: { userId: USER_ID, name: '[TEST] Hata Loglama', trigger: 'manual_trigger',
            status: 'active', flowData: JSON.stringify(flowData) },
  })

  const { runId } = await startRun(auto.id, CUSTOMER_ID, {})
  const run   = await prisma.automationRun.findUnique({ where: { id: runId } })
  const steps = await prisma.automationRunStep.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })
  const logs  = await prisma.automationLog.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })

  info(`Run status: ${run?.status}`)
  for (const s of steps) {
    const icon = { completed: '✅', waiting: '⏳', failed: '❌' }[s.status] ?? '⬜'
    console.log(`     ${icon} [${s.nodeType}] "${s.nodeLabel}" — ${s.status}`)
    if (s.error) console.log(`        error: ${s.error.slice(0, 100)}`)
  }

  const errorLogs = logs.filter(l => l.level === 'error')
  if (errorLogs.length > 0) {
    ok(`Hata loglandı (${errorLogs.length} kayıt)`)
    ok(`Run.failReason: ${run?.failReason?.slice(0, 80)}`)
    if (run?.status === 'failed') ok('Run status=failed olarak işaretlendi ✓')
  } else {
    info(`Log sayısı: ${logs.length} — ${logs.map(l => l.message).join(', ')}`)
  }

  await cleanup(auto.id)
  info('Test verisi temizlendi')
}

/* ─────────────────────────────────────────────────────────────
   ANA ÇALIŞTIRICI
───────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n🚀 Automation Runtime — Gerçek Entegrasyon Testi\n')
  try {
    await scenario1()
    await scenario2()
    await scenario3()
    console.log('\n' + '═'.repeat(62))
    console.log('  Tüm senaryolar tamamlandı')
    console.log('═'.repeat(62) + '\n')
  } catch (err) {
    console.error('\n🔴 Beklenmedik hata:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
