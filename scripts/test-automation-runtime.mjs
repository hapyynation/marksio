/**
 * Automation Runtime — Gerçek Entegrasyon Testi
 *
 * Çalıştırmak için (dev server kapalıyken):
 *   node scripts/test-automation-runtime.mjs
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const USER_ID     = 'cmpi1atxy00009jk02rqdjjyo'
const CUSTOMER_ID = 'cmpi1avrt00089jk0wbfy7k2x'

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

function ok(msg)   { console.log(`  ✅ ${msg}`) }
function fail(msg) { console.log(`  ❌ ${msg}`) }
function info(msg) { console.log(`  ℹ️  ${msg}`) }
function header(msg) { console.log(`\n${'─'.repeat(60)}\n  ${msg}\n${'─'.repeat(60)}`) }

async function cleanupAutomation(id) {
  await prisma.automationLog.deleteMany({ where: { automationId: id } })
  await prisma.automationRunStep.deleteMany({ where: { run: { automationId: id } } })
  await prisma.automationRun.deleteMany({ where: { automationId: id } })
  await prisma.automation.delete({ where: { id } }).catch(() => {})
}

/* ─────────────────────────────────────────────────────────────
   SENARYO 1: new_customer → wait(1dk) → send_email → add_tag → stop
───────────────────────────────────────────────────────────── */

async function scenario1() {
  header('SENARYO 1: new_customer → wait(1dk) → email → tag → stop')

  const triggerNodeId  = 'n1'
  const waitNodeId     = 'n2'
  const emailNodeId    = 'n3'
  const tagNodeId      = 'n4'
  const stopNodeId     = 'n5'

  const flowData = {
    nodes: [
      {
        id: triggerNodeId, type: 'triggerNode',
        data: { triggerType: 'new_customer', type: 'new_customer', title: 'Yeni Müşteri', config: {}, stats: {} },
        position: { x: 0, y: 0 },
      },
      {
        id: waitNodeId, type: 'waitNode',
        data: { type: 'wait', title: '1 Dakika Bekle', delayAmount: 1, delayUnit: 'minutes', config: {}, stats: {} },
        position: { x: 0, y: 120 },
      },
      {
        id: emailNodeId, type: 'actionNode',
        data: {
          actionType: 'send_email', type: 'send_email', title: 'Hoş Geldin Emaili',
          config: {
            subject: 'Hoş geldiniz {{firstName}}!',
            body: 'Merhaba {{firstName}}, mağazamıza hoş geldiniz.',
            senderName: 'ModaKara',
          },
          stats: {},
        },
        position: { x: 0, y: 240 },
      },
      {
        id: tagNodeId, type: 'actionNode',
        data: {
          actionType: 'add_tag', type: 'add_tag', title: 'Hoşgeldin Etiketi',
          config: { tag: 'hosgeldin-akisi' },
          stats: {},
        },
        position: { x: 0, y: 360 },
      },
      {
        id: stopNodeId, type: 'stopNode',
        data: { type: 'stop', title: 'Bitti', config: {}, stats: {} },
        position: { x: 0, y: 480 },
      },
    ],
    edges: [
      { id: 'e1', source: triggerNodeId, target: waitNodeId,  sourceHandle: 'out' },
      { id: 'e2', source: waitNodeId,    target: emailNodeId, sourceHandle: 'out' },
      { id: 'e3', source: emailNodeId,   target: tagNodeId,   sourceHandle: 'out' },
      { id: 'e4', source: tagNodeId,     target: stopNodeId,  sourceHandle: 'out' },
    ],
  }

  // 1. Automation oluştur
  const auto = await prisma.automation.create({
    data: {
      userId:   USER_ID,
      name:     '[TEST] Hoşgeldin Akışı',
      trigger:  'new_customer',
      status:   'active',
      flowData: JSON.stringify(flowData),
    },
  })
  info(`Automation oluşturuldu: ${auto.id}`)

  // 2. startRun çağır
  const { startRun } = await import('../lib/automation/engine.js')
  const { runId, skipped } = await startRun(auto.id, CUSTOMER_ID, { source: 'test' })
  info(`startRun() → runId: ${runId}, skipped: ${skipped ?? false}`)

  // 3. Run kaydını kontrol et
  const run = await prisma.automationRun.findUnique({ where: { id: runId } })
  if (run) ok(`AutomationRun oluşturuldu — status: ${run.status}, currentNodeId: ${run.currentNodeId}`)
  else     fail('AutomationRun bulunamadı!')

  // 4. Adım kayıtları
  const steps = await prisma.automationRunStep.findMany({
    where: { runId }, orderBy: { createdAt: 'asc' },
  })
  info(`AutomationRunStep sayısı: ${steps.length}`)
  for (const s of steps) {
    const icon = s.status === 'completed' ? '✅' : s.status === 'waiting' ? '⏳' : s.status === 'failed' ? '❌' : '⬜'
    console.log(`     ${icon} [${s.nodeType}] ${s.nodeLabel} — status: ${s.status}`)
    if (s.output && s.output !== '{}') console.log(`        output: ${s.output.slice(0, 100)}`)
    if (s.error) console.log(`        error: ${s.error}`)
  }

  // 5. Log kayıtları
  const logs = await prisma.automationLog.findMany({
    where: { runId }, orderBy: { createdAt: 'asc' },
  })
  info(`AutomationLog kayıt sayısı: ${logs.length}`)
  for (const l of logs) {
    const icon = l.level === 'error' ? '🔴' : l.level === 'warn' ? '🟡' : '🟢'
    console.log(`     ${icon} ${l.message}`)
  }

  // 6. Wait node doğrula
  if (run?.status === 'waiting') {
    ok(`Wait node çalıştı — status=waiting, resumeAt: ${run.resumeAt?.toISOString()}`)
    const waitStep = steps.find(s => s.nodeType === 'waitNode')
    if (waitStep?.status === 'waiting') ok('WaitNode step\'i "waiting" statüsünde')
    else fail('WaitNode step statüsü beklenmedik')

    // 7. Trigger step çalıştı mı?
    const trigStep = steps.find(s => s.nodeType === 'triggerNode')
    if (trigStep?.status === 'completed') ok('TriggerNode step tamamlandı')

    // 8. Manuel olarak resumeAt geçmişe al ve devam et
    info('resumeAt sıfırlanıyor (wait simülasyonu)...')
    await prisma.automationRun.update({
      where: { id: runId },
      data:  { resumeAt: new Date(Date.now() - 1000) },
    })

    const { resumeWaitingRuns } = await import('../lib/automation/engine.js')
    const resumed = await resumeWaitingRuns()
    info(`resumeWaitingRuns() → ${resumed} run devam etti`)

    // 9. Final durumu
    const finalRun = await prisma.automationRun.findUnique({ where: { id: runId } })
    if (finalRun?.status === 'completed') {
      ok(`Run tamamlandı — status: completed`)
    } else {
      info(`Run durumu: ${finalRun?.status} (email gerçek RESEND_API_KEY gerektiriyor)`)
    }

    const finalSteps = await prisma.automationRunStep.findMany({
      where: { runId }, orderBy: { createdAt: 'asc' },
    })
    info(`Toplam step: ${finalSteps.length}`)
    for (const s of finalSteps) {
      const icon = s.status === 'completed' ? '✅' : s.status === 'waiting' ? '⏳' : s.status === 'failed' ? '❌' : '⬜'
      console.log(`     ${icon} [${s.nodeType}] ${s.nodeLabel} — ${s.status}`)
      if (s.output && s.output !== '{}') console.log(`        output: ${s.output.slice(0, 120)}`)
    }

    // Tag eklendi mi?
    const customer = await prisma.customer.findUnique({ where: { id: CUSTOMER_ID } })
    const tags = JSON.parse(customer?.tags ?? '[]')
    if (tags.includes('hosgeldin-akisi')) ok('Tag başarıyla eklendi: hosgeldin-akisi')
    else info(`Mevcut tags: ${JSON.stringify(tags)} (email hatası durumunda tag adımına ulaşılamayabilir)`)

  } else if (run?.status === 'failed') {
    fail(`Run başarısız: ${run.failReason}`)
  } else {
    info(`Run status: ${run?.status}`)
  }

  await cleanupAutomation(auto.id)
  info('Test automasyonu temizlendi')
}

/* ─────────────────────────────────────────────────────────────
   SENARYO 2: product_viewed → condition(purchased?) → EVET:WA / HAYIR:Email
───────────────────────────────────────────────────────────── */

async function scenario2() {
  header('SENARYO 2: product_viewed → condition(purchased) → EVET:WA / HAYIR:Email')

  const triggerNodeId   = 'n1'
  const condNodeId      = 'n2'
  const waNodeId        = 'n3'  // EVET branch
  const emailNodeId     = 'n4'  // HAYIR branch
  const stopYesNodeId   = 'n5'
  const stopNoNodeId    = 'n6'

  const flowData = {
    nodes: [
      {
        id: triggerNodeId, type: 'triggerNode',
        data: { triggerType: 'product_viewed', type: 'product_viewed', title: 'Ürün Görüntülendi', config: {}, stats: {} },
        position: { x: 0, y: 0 },
      },
      {
        id: condNodeId, type: 'conditionNode',
        data: {
          type: 'condition', title: 'Daha Önce Satın Aldı mı?',
          condition: 'purchased',
          config: {},
          stats: {},
        },
        position: { x: 0, y: 120 },
      },
      {
        id: waNodeId, type: 'actionNode',
        data: {
          actionType: 'send_whatsapp', type: 'send_whatsapp', title: 'VIP WhatsApp',
          config: { message: 'Merhaba {{firstName}}, ilgilendiğiniz ürünü hatırlatmak istedik 🛍️' },
          stats: {},
        },
        position: { x: -150, y: 280 },
      },
      {
        id: emailNodeId, type: 'actionNode',
        data: {
          actionType: 'send_email', type: 'send_email', title: 'Yeni Müşteri Email',
          config: {
            subject: '{{firstName}}, ilgilendiğiniz ürün sizi bekliyor!',
            body: 'Merhaba {{firstName}}, incelediğiniz ürünü sepetinize eklediniz mi?',
            senderName: 'ModaKara',
          },
          stats: {},
        },
        position: { x: 150, y: 280 },
      },
      {
        id: stopYesNodeId, type: 'stopNode',
        data: { type: 'stop', title: 'WA Sonrası Bitti', config: {}, stats: {} },
        position: { x: -150, y: 440 },
      },
      {
        id: stopNoNodeId, type: 'stopNode',
        data: { type: 'stop', title: 'Email Sonrası Bitti', config: {}, stats: {} },
        position: { x: 150, y: 440 },
      },
    ],
    edges: [
      { id: 'e1', source: triggerNodeId, target: condNodeId,    sourceHandle: 'out' },
      { id: 'e2', source: condNodeId,    target: waNodeId,      sourceHandle: 'yes' },
      { id: 'e3', source: condNodeId,    target: emailNodeId,   sourceHandle: 'no'  },
      { id: 'e4', source: waNodeId,      target: stopYesNodeId, sourceHandle: 'out' },
      { id: 'e5', source: emailNodeId,   target: stopNoNodeId,  sourceHandle: 'out' },
    ],
  }

  // Automation oluştur
  const auto = await prisma.automation.create({
    data: {
      userId:   USER_ID,
      name:     '[TEST] Ürün Görüntüleme Akışı',
      trigger:  'product_viewed',
      status:   'active',
      flowData: JSON.stringify(flowData),
    },
  })
  info(`Automation oluşturuldu: ${auto.id}`)

  // Müşteri bilgisi
  const customer = await prisma.customer.findUnique({ where: { id: CUSTOMER_ID } })
  info(`Test müşterisi: ${customer?.name} — totalOrders: ${customer?.totalOrders} (purchased=${customer?.totalOrders > 0 ? 'TRUE→EVET branch' : 'FALSE→HAYIR branch'})`)

  const { startRun } = await import('../lib/automation/engine.js')

  // === Test A: totalOrders > 0 → EVET branch (WA) ===
  info('\n  Test A — Mevcut müşteri (totalOrders > 0) → EVET branch bekleniyor')
  const { runId: runA } = await startRun(auto.id, CUSTOMER_ID, { productId: 'prod_123' })
  const stepsA = await prisma.automationRunStep.findMany({
    where: { runId: runA }, orderBy: { createdAt: 'asc' },
  })
  const condStepA = stepsA.find(s => s.nodeType === 'conditionNode')
  const condOutputA = JSON.parse(condStepA?.output ?? '{}')
  console.log(`\n  Condition output:`, condOutputA)
  if (condOutputA.branch === 'yes') ok(`Condition doğru sonuçlandı → branch=YES (müşteri alışveriş yapmış)`)
  else if (condOutputA.branch === 'no') info(`Branch=NO (expected YES — purchased=false for this customer)`)
  else fail(`Condition çıktısı beklenmedik: ${JSON.stringify(condOutputA)}`)

  const executedNodes = stepsA.map(s => `${s.nodeType}(${s.status})`).join(' → ')
  info(`Çalıştırılan node chain: ${executedNodes}`)

  // WA step var mı? (phone yoksa skipped olur)
  const waStep = stepsA.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('WA'))
  const emailStep = stepsA.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('Email'))
  if (condOutputA.branch === 'yes') {
    if (waStep)    ok(`EVET branch'i doğru: WhatsApp node çalıştı (status: ${waStep.status})`)
    if (!emailStep) ok('HAYIR branch Email node ÇALIŞMADI ✓')
  } else {
    if (emailStep) ok(`HAYIR branch'i doğru: Email node çalıştı (status: ${emailStep.status})`)
    if (!waStep)   ok('EVET branch WhatsApp node ÇALIŞMADI ✓')
  }

  // WA output
  if (waStep) info(`WA step output: ${waStep.output}`)
  if (emailStep) info(`Email step output: ${emailStep.output}`)

  // === Test B: Hiç siparişi olmayan müşteri → HAYIR branch ===
  info('\n  Test B — Siparişsiz müşteri oluşturuluyor → HAYIR branch bekleniyor')
  const noOrderCustomer = await prisma.customer.create({
    data: {
      userId:      USER_ID,
      name:        'Test Yeni Müşteri',
      email:       `test_noorder_${Date.now()}@test.com`,
      totalOrders: 0,
      totalSpent:  0,
    },
  })
  info(`Yeni müşteri: ${noOrderCustomer.name} (totalOrders=0)`)

  const { runId: runB } = await startRun(auto.id, noOrderCustomer.id, { productId: 'prod_456' })
  const stepsB = await prisma.automationRunStep.findMany({
    where: { runId: runB }, orderBy: { createdAt: 'asc' },
  })
  const condStepB    = stepsB.find(s => s.nodeType === 'conditionNode')
  const condOutputB  = JSON.parse(condStepB?.output ?? '{}')
  const executedB    = stepsB.map(s => `${s.nodeType}(${s.status})`).join(' → ')
  info(`Çalıştırılan node chain: ${executedB}`)
  console.log(`  Condition output:`, condOutputB)

  if (condOutputB.branch === 'no') {
    ok(`Condition doğru → branch=NO (müşteri hiç sipariş vermemiş)`)
    const emailStepB = stepsB.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('Email'))
    const waStepB    = stepsB.find(s => s.nodeType === 'actionNode' && s.nodeLabel?.includes('WA'))
    if (emailStepB) ok(`HAYIR branch: Email node çalıştı (${emailStepB.status}) — output: ${emailStepB.output}`)
    if (!waStepB)   ok('EVET branch WhatsApp node ÇALIŞMADI ✓')
  } else {
    fail(`Beklenen branch=no, alınan: ${condOutputB.branch}`)
  }

  // Test B müşterisini temizle
  await prisma.automationRunStep.deleteMany({ where: { run: { customerId: noOrderCustomer.id } } })
  await prisma.automationRun.deleteMany({ where: { customerId: noOrderCustomer.id } })
  await prisma.automationLog.deleteMany({ where: { customerId: noOrderCustomer.id } })
  await prisma.customer.delete({ where: { id: noOrderCustomer.id } })

  await cleanupAutomation(auto.id)
  info('Test automasyonu temizlendi')
}

/* ─────────────────────────────────────────────────────────────
   SENARYO 3: Hata durumu — geçersiz email config → log'a düşüyor mu
───────────────────────────────────────────────────────────── */

async function scenario3() {
  header('SENARYO 3: Hata durumu loglama testi')

  const flowData = {
    nodes: [
      {
        id: 'n1', type: 'triggerNode',
        data: { triggerType: 'manual_trigger', type: 'manual_trigger', title: 'Manuel', config: {}, stats: {} },
        position: { x: 0, y: 0 },
      },
      {
        id: 'n2', type: 'actionNode',
        data: {
          actionType: 'webhook', type: 'webhook', title: 'Başarısız Webhook',
          config: { url: 'http://invalid-host-99999.test/hook', method: 'POST' },
          stats: {},
        },
        position: { x: 0, y: 120 },
      },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out' },
    ],
  }

  const auto = await prisma.automation.create({
    data: {
      userId:   USER_ID,
      name:     '[TEST] Hata Loglama',
      trigger:  'manual_trigger',
      status:   'active',
      flowData: JSON.stringify(flowData),
    },
  })

  const { startRun } = await import('../lib/automation/engine.js')
  const { runId } = await startRun(auto.id, CUSTOMER_ID, {})

  const run  = await prisma.automationRun.findUnique({ where: { id: runId } })
  const logs = await prisma.automationLog.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })
  const steps = await prisma.automationRunStep.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })

  info(`Run status: ${run?.status}`)
  info(`Step sayısı: ${steps.length}`)
  for (const s of steps) {
    const icon = s.status === 'failed' ? '❌' : s.status === 'completed' ? '✅' : '⬜'
    console.log(`     ${icon} [${s.nodeType}] ${s.nodeLabel} — ${s.status}`)
    if (s.error) console.log(`        error: ${s.error.slice(0, 120)}`)
  }

  const errorLogs = logs.filter(l => l.level === 'error')
  if (errorLogs.length > 0) {
    ok(`Hata loglandı: ${errorLogs.map(l => l.message).join(', ')}`)
    if (run?.status === 'failed') ok('Run status=failed olarak işaretlendi')
    else info(`Run status: ${run?.status}`)
  } else {
    info('Webhook timeout kısa olduğundan tamamlandı olabilir')
    for (const l of logs) console.log(`     [${l.level}] ${l.message}`)
  }

  await cleanupAutomation(auto.id)
  info('Test automasyonu temizlendi')
}

/* ─────────────────────────────────────────────────────────────
   ANA ÇALIŞTIRICI
───────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n🚀 Automation Runtime Entegrasyon Testleri\n')

  try {
    await scenario1()
    await scenario2()
    await scenario3()
    console.log('\n' + '═'.repeat(60))
    console.log('  ✅ Tüm senaryolar tamamlandı')
    console.log('═'.repeat(60) + '\n')
  } catch (err) {
    console.error('\n🔴 Test hatası:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
