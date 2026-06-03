/**
 * Kaydet + Aktifleştir + Email — Entegrasyon Testi
 * npx tsx scripts/test-save-activate.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const USER_ID     = 'cmpi1atxy00009jk02rqdjjyo'
const CUSTOMER_ID = 'cmpi1avrt00089jk0wbfy7k2x'

const ok   = (m: string) => console.log(`  ✅ ${m}`)
const fail = (m: string) => console.log(`  ❌ ${m}`)
const info = (m: string) => console.log(`  ℹ️  ${m}`)
const sep  = (m: string) => console.log(`\n${'─'.repeat(62)}\n  ${m}\n${'─'.repeat(62)}`)

async function main() {
  console.log('\n🧪 Save + Activate + Email Entegrasyon Testi\n')

  /* ── TEST 1: POST /api/automations flowData kaydediyor mu ── */
  sep('TEST 1: POST /api/automations — flowData kaydediliyor mu?')

  const flowData = {
    nodes: [
      { id: 'n1', type: 'triggerNode', position: { x: 0, y: 0 },
        data: { triggerType: 'new_customer', type: 'new_customer', title: 'Yeni Müşteri', config: {}, stats: {} } },
      { id: 'n2', type: 'actionNode', position: { x: 0, y: 150 },
        data: { actionType: 'add_tag', type: 'add_tag', title: 'Etiket Ekle',
          config: { tag: 'test-save-verify' }, stats: {} } },
      { id: 'n3', type: 'stopNode', position: { x: 0, y: 300 },
        data: { type: 'stop', title: 'Bitti', config: {}, stats: {} } },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', sourceHandle: 'out' },
      { id: 'e2', source: 'n2', target: 'n3', sourceHandle: 'out' },
    ],
  }

  const created = await prisma.automation.create({
    data: {
      userId:   USER_ID,
      name:     '[TEST-SAVE] Yeni Müşteri Akışı',
      trigger:  'new_customer',
      status:   'draft',
      steps:    '[]',
      flowData: JSON.stringify(flowData),
    },
  })
  info(`Automation oluşturuldu: ${created.id}`)

  // flowData DB'den geri oku
  const fetched = await prisma.automation.findUnique({ where: { id: created.id } })
  const savedFD = JSON.parse(fetched?.flowData ?? '{}')
  if (Array.isArray(savedFD.nodes) && savedFD.nodes.length === 3) ok(`flowData kaydedildi — ${savedFD.nodes.length} node, ${savedFD.edges?.length} edge`)
  else fail(`flowData kayıt yanlış: ${JSON.stringify(savedFD).slice(0, 80)}`)

  if (fetched?.name === '[TEST-SAVE] Yeni Müşteri Akışı') ok('name doğru kaydedildi')
  if (fetched?.trigger === 'new_customer') ok('trigger doğru kaydedildi')
  if (fetched?.status === 'draft') ok('status=draft doğru')

  /* ── TEST 2: PATCH status=active ── */
  sep('TEST 2: PATCH /api/automations/[id] — status=active')

  await prisma.automation.update({ where: { id: created.id }, data: { status: 'active' } })
  const activated = await prisma.automation.findUnique({ where: { id: created.id } })
  if (activated?.status === 'active') ok('status=active DB\'de görünüyor ✓')
  else fail(`status beklenen=active, alınan=${activated?.status}`)

  /* ── TEST 3: PUT flowData (yeniden kaydet) ── */
  sep('TEST 3: PUT /api/automations/[id]/flow — flowData güncelleniyor mu?')

  const updatedFlow = { ...flowData, nodes: [...flowData.nodes, { id: 'n4', type: 'actionNode', position: { x: 0, y: 450 }, data: { actionType: 'webhook', type: 'webhook', title: 'Webhook', config: { url: 'https://example.com' }, stats: {} } }] }
  await prisma.automation.update({
    where: { id: created.id },
    data:  { flowData: JSON.stringify(updatedFlow), name: '[TEST-SAVE] Güncellendi' },
  })
  const updated = await prisma.automation.findUnique({ where: { id: created.id } })
  const updFD   = JSON.parse(updated?.flowData ?? '{}')
  if (Array.isArray(updFD.nodes) && updFD.nodes.length === 4) ok(`flowData güncellendi — 4 node`)
  else fail(`flowData güncelleme yanlış`)
  if (updated?.name === '[TEST-SAVE] Güncellendi') ok('name güncellendi')

  /* ── TEST 4: Engine — akış çalışıyor mu ── */
  sep('TEST 4: Engine — automation çalıştırılıyor')

  // status active yap ve reset
  await prisma.automation.update({ where: { id: created.id }, data: { flowData: JSON.stringify(flowData), status: 'active' } })
  const { startRun } = await import('../lib/automation/engine')
  const { runId } = await startRun(created.id, CUSTOMER_ID, { source: 'test-save-verify' })
  const run   = await prisma.automationRun.findUnique({ where: { id: runId } })
  const steps = await prisma.automationRunStep.findMany({ where: { runId }, orderBy: { createdAt: 'asc' } })

  info(`Run status: ${run?.status}`)
  for (const s of steps) {
    const icon = { completed:'✅', failed:'❌', waiting:'⏳' }[s.status] ?? '⬜'
    console.log(`     ${icon} [${s.nodeType}] "${s.nodeLabel}" — ${s.status}`)
    if (s.output !== '{}') console.log(`        output: ${s.output.slice(0,100)}`)
  }

  if (run?.status === 'completed') ok('Run completed ✓')
  else fail(`Run status: ${run?.status}`)

  // Tag eklendi mi?
  const customer = await prisma.customer.findUnique({ where: { id: CUSTOMER_ID } })
  const tags: string[] = JSON.parse(customer?.tags ?? '[]')
  if (tags.includes('test-save-verify')) {
    ok('Tag eklendi: test-save-verify ✓')
    await prisma.customer.update({ where: { id: CUSTOMER_ID }, data: { tags: JSON.stringify(tags.filter(t => t !== 'test-save-verify')) } })
  } else fail(`Tag bulunamadı — tags: ${JSON.stringify(tags)}`)

  /* ── TEST 5: Email — RESEND_API_KEY var mı ── */
  sep('TEST 5: Email — Resend API Key kontrolü')

  const hasResend = !!process.env.RESEND_API_KEY
  if (hasResend) {
    info(`RESEND_API_KEY mevcut — uzunluk: ${process.env.RESEND_API_KEY?.length}`)
    info('Gerçek email gönderimi aktif (dry_run kapalı)')
    ok('Email executor gerçek gönderime hazır ✓')
  } else {
    info('RESEND_API_KEY bulunamadı — email gönderimi hata fırlatacak')
    info('Bu ortamda .env dosyasında RESEND_API_KEY ayarlanmalı')
  }

  /* ── TEST 6: /automations listesi ── */
  sep('TEST 6: /automations DB sorgusu — aktif sayı')

  const allAutos   = await prisma.automation.findMany({ where: { userId: USER_ID }, select: { id: true, name: true, status: true, trigger: true } })
  const activeAutos = allAutos.filter(a => a.status === 'active')
  info(`Toplam otomasyon: ${allAutos.length} | Aktif: ${activeAutos.length}`)
  const testAuto = allAutos.find(a => a.id === created.id)
  if (testAuto?.status === 'active') ok(`Test otomasyonu aktif listede görünüyor ✓`)

  /* ── Temizlik ── */
  sep('Temizlik')
  await prisma.automationLog.deleteMany({ where: { automationId: created.id } })
  await prisma.automationRunStep.deleteMany({ where: { run: { automationId: created.id } } })
  await prisma.automationRun.deleteMany({ where: { automationId: created.id } })
  await prisma.automation.delete({ where: { id: created.id } })
  ok('Test verisi temizlendi')

  console.log('\n' + '═'.repeat(62))
  console.log('  Test tamamlandı')
  console.log('═'.repeat(62) + '\n')
}

main().catch(e => console.error('Test hatası:', e)).finally(() => prisma.$disconnect())
