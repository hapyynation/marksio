/**
 * Inbox test seed script
 * Usage: npx ts-node --project tsconfig.seed.json scripts/seed-inbox.ts <userId>
 * Or:    npx tsx scripts/seed-inbox.ts <userId>
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const userId = process.argv[2]
  if (!userId) {
    console.error('Usage: npx tsx scripts/seed-inbox.ts <userId>')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    console.error(`User ${userId} not found`)
    process.exit(1)
  }

  console.log(`\nSeeding inbox test data for user: ${user.name} (${user.email})\n`)

  // ── 1. WhatsappAccount (test / dummy) ────────────────────────────────────────
  const account = await prisma.whatsappAccount.upsert({
    where: { phoneNumberId: 'TEST_PHONE_ID_SEED' },
    create: {
      userId,
      wabaId: 'TEST_WABA_ID',
      phoneNumberId: 'TEST_PHONE_ID_SEED',
      accessToken: 'test_token_encrypted',
      appSecret: 'test_secret',
      displayName: 'Test Hesabı',
      verifiedName: 'Test Hesabı',
      status: 'CONNECTED',
      webhookVerifyToken: `seed_verify_${userId.slice(0, 8)}`,
    },
    update: { status: 'CONNECTED' },
  })
  console.log(`✓ WhatsappAccount: ${account.id}`)

  // ── 2. Customers ─────────────────────────────────────────────────────────────
  const c1 = await prisma.customer.upsert({
    where: { userId_email: { userId, email: 'ayse.kaya@test.com' } },
    create: {
      userId, name: 'Ayşe Kaya', email: 'ayse.kaya@test.com',
      phone: '+905321234567', segment: 'vip',
      totalOrders: 5, totalSpent: 3250.00, avgOrder: 650.00,
      lastOrder: new Date('2024-05-15'), score: 85, riskScore: 'low',
    },
    update: { phone: '+905321234567', segment: 'vip', riskScore: 'low' },
  })

  const c2 = await prisma.customer.upsert({
    where: { userId_email: { userId, email: 'mehmet.demir@test.com' } },
    create: {
      userId, name: 'Mehmet Demir', email: 'mehmet.demir@test.com',
      phone: '+905339876543', segment: 'at_risk',
      totalOrders: 2, totalSpent: 890.00, avgOrder: 445.00,
      lastOrder: new Date('2024-03-01'), score: 35, riskScore: 'high',
    },
    update: { phone: '+905339876543', segment: 'at_risk', riskScore: 'high' },
  })
  console.log(`✓ Customers: ${c1.id}, ${c2.id}`)

  // ── 3. Orders ────────────────────────────────────────────────────────────────
  const o1 = await prisma.order.upsert({
    where: { userId_platformOrderId: { userId, platformOrderId: 'SEED_ORD_001' } },
    create: {
      userId, customerId: c1.id, platformOrderId: 'SEED_ORD_001',
      orderNumber: '#1042', status: 'delivered', financialStatus: 'paid',
      total: 1250.00, subtotal: 1150.00, shipping: 100.00,
      currency: 'TRY', placedAt: new Date('2024-05-10'),
    },
    update: {},
  })

  await prisma.orderItem.deleteMany({ where: { orderId: o1.id } })
  await prisma.orderItem.createMany({
    data: [
      { orderId: o1.id, title: 'Pamuklu Tişört', variantTitle: 'M / Beyaz', quantity: 2, price: 299.00 },
      { orderId: o1.id, title: 'Kot Pantolon', variantTitle: '32 / Mavi', quantity: 1, price: 652.00 },
    ],
  })

  const o2 = await prisma.order.upsert({
    where: { userId_platformOrderId: { userId, platformOrderId: 'SEED_ORD_002' } },
    create: {
      userId, customerId: c2.id, platformOrderId: 'SEED_ORD_002',
      orderNumber: '#987', status: 'cancelled', financialStatus: 'refunded',
      total: 450.00, subtotal: 420.00, shipping: 30.00,
      currency: 'TRY', placedAt: new Date('2024-03-01'),
    },
    update: {},
  })

  await prisma.orderItem.deleteMany({ where: { orderId: o2.id } })
  await prisma.orderItem.createMany({
    data: [
      { orderId: o2.id, title: 'Spor Ayakkabı', variantTitle: '42 / Siyah', quantity: 1, price: 420.00 },
    ],
  })
  console.log(`✓ Orders: ${o1.id}, ${o2.id}`)

  // ── 4. WhatsappContacts ──────────────────────────────────────────────────────
  const contact1 = await prisma.whatsappContact.upsert({
    where: { userId_phoneNumber: { userId, phoneNumber: '+905321234567' } },
    create: { userId, phoneNumber: '+905321234567', optInStatus: 'OPTED_IN', lastInboundAt: new Date() },
    update: {},
  })

  const contact2 = await prisma.whatsappContact.upsert({
    where: { userId_phoneNumber: { userId, phoneNumber: '+905339876543' } },
    create: { userId, phoneNumber: '+905339876543', optInStatus: 'OPTED_IN', lastInboundAt: new Date() },
    update: {},
  })
  console.log(`✓ WhatsappContacts: ${contact1.id}, ${contact2.id}`)

  // ── 5. WhatsappConversations ─────────────────────────────────────────────────
  const conv1 = await prisma.whatsappConversation.upsert({
    where: { id: `seed_conv_1_${userId.slice(0, 8)}` },
    create: {
      id: `seed_conv_1_${userId.slice(0, 8)}`,
      contactId: contact1.id, accountId: account.id,
      status: 'HUMAN_TAKEOVER',
      lastMessageAt: new Date(Date.now() - 5 * 60 * 1000),
    },
    update: { lastMessageAt: new Date(Date.now() - 5 * 60 * 1000) },
  })

  const conv2 = await prisma.whatsappConversation.upsert({
    where: { id: `seed_conv_2_${userId.slice(0, 8)}` },
    create: {
      id: `seed_conv_2_${userId.slice(0, 8)}`,
      contactId: contact2.id, accountId: account.id,
      status: 'AI_HANDLING',
      lastMessageAt: new Date(Date.now() - 30 * 60 * 1000),
    },
    update: { lastMessageAt: new Date(Date.now() - 30 * 60 * 1000) },
  })
  console.log(`✓ Conversations: ${conv1.id}, ${conv2.id}`)

  // ── 6. Messages ──────────────────────────────────────────────────────────────
  await prisma.whatsappMessage.deleteMany({
    where: { conversationId: { in: [conv1.id, conv2.id] } },
  })

  const now = Date.now()
  await prisma.whatsappMessage.createMany({
    data: [
      // conv1 — Ayşe (human takeover)
      { conversationId: conv1.id, direction: 'INBOUND', content: 'Merhaba, siparişim nerede?', status: 'DELIVERED', sentAt: new Date(now - 25 * 60000) },
      { conversationId: conv1.id, direction: 'OUTBOUND', content: 'Merhaba Ayşe Hanım! Siparişinizi kontrol ediyorum.', status: 'READ', sentAt: new Date(now - 24 * 60000) },
      { conversationId: conv1.id, direction: 'INBOUND', content: '#1042 numaralı siparişim için soruyorum, 3 gündür bekliyorum.', status: 'DELIVERED', sentAt: new Date(now - 10 * 60000) },
      // conv2 — Mehmet (AI handling)
      { conversationId: conv2.id, direction: 'INBOUND', content: 'İade yapmak istiyorum, nasıl yapabilirim?', status: 'DELIVERED', sentAt: new Date(now - 45 * 60000) },
      { conversationId: conv2.id, direction: 'OUTBOUND', content: 'Merhaba! İade işleminiz için size yardımcı olabilirim. Sipariş numaranızı paylaşır mısınız?', status: 'READ', sentAt: new Date(now - 44 * 60000) },
      { conversationId: conv2.id, direction: 'INBOUND', content: '#987 numaralı siparişimi iade etmek istiyorum.', status: 'DELIVERED', sentAt: new Date(now - 30 * 60000) },
    ],
  })
  console.log('✓ Messages: 6 created')

  // ── 7. AI Decision Log ───────────────────────────────────────────────────────
  await prisma.aiDecisionLog.deleteMany({ where: { conversationId: conv2.id } })
  await prisma.aiDecisionLog.create({
    data: {
      conversationId: conv2.id, userId,
      intent: 'return_request',
      confidence: 0.88,
      knowledgeSource: 'order_data',
      faqMatched: null,
      orderDataUsed: true,
      transferred: false,
      transferReason: null,
      action: 'auto_reply',
      responsePreview: 'İade işleminiz için size yardımcı olabilirim. Sipariş numaranızı paylaşır mısınız?',
    },
  })
  console.log('✓ AiDecisionLog: 1 created')

  // ── 8. Internal Note ─────────────────────────────────────────────────────────
  await prisma.internalNote.deleteMany({ where: { conversationId: conv1.id } })
  await prisma.internalNote.create({
    data: {
      conversationId: conv1.id, userId,
      note: 'Müşteri çok sabırsız davranıyor. Kargo takip linkini paylaş ve ücretsiz kargo kodu ver.',
      createdBy: user.name,
    },
  })
  console.log('✓ InternalNote: 1 created')

  // ── 9. Tags ──────────────────────────────────────────────────────────────────
  const tag1 = await prisma.conversationTag.upsert({
    where: { userId_name: { userId, name: 'VIP' } },
    create: { userId, name: 'VIP', color: '#9f7afa' },
    update: {},
  })

  const tag2 = await prisma.conversationTag.upsert({
    where: { userId_name: { userId, name: 'İade' } },
    create: { userId, name: 'İade', color: '#f0a020' },
    update: {},
  })

  await prisma.conversationTagLink.upsert({
    where: { conversationId_tagId: { conversationId: conv1.id, tagId: tag1.id } },
    create: { conversationId: conv1.id, tagId: tag1.id },
    update: {},
  })

  await prisma.conversationTagLink.upsert({
    where: { conversationId_tagId: { conversationId: conv2.id, tagId: tag2.id } },
    create: { conversationId: conv2.id, tagId: tag2.id },
    update: {},
  })
  console.log(`✓ Tags: VIP → conv1, İade → conv2`)

  console.log('\n✅ Seed tamamlandı!')
  console.log(`\nInbox'ta görmek için: /whatsapp/inbox`)
  console.log(`Conv1 (Ayşe / HUMAN_TAKEOVER): ${conv1.id}`)
  console.log(`Conv2 (Mehmet / AI_HANDLING): ${conv2.id}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
