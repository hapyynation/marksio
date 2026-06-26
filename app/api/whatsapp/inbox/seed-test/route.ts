import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiSession } from '@/lib/auth'

export async function POST() {
  const session = await getApiSession()
  if (!session) return new Response('Unauthorized', { status: 401 })

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } })

  // Ensure a test WhatsappAccount exists
  const account = await prisma.whatsappAccount.upsert({
    where: { phoneNumberId: `TEST_SEED_${userId.slice(0, 8)}` },
    create: {
      userId,
      wabaId: 'TEST_WABA_SEED',
      phoneNumberId: `TEST_SEED_${userId.slice(0, 8)}`,
      accessToken: 'test_token',
      appSecret: 'test_secret',
      displayName: 'Test Hesabı',
      status: 'CONNECTED',
      isDemo: true,
      webhookVerifyToken: `seed_wh_${userId.slice(0, 8)}`,
    },
    update: {},
  })

  // Upsert test customer
  const customer = await prisma.customer.upsert({
    where: { userId_email: { userId, email: `test.musteri.${userId.slice(0, 6)}@seed.com` } },
    create: {
      userId,
      name: 'Test Müşteri',
      email: `test.musteri.${userId.slice(0, 6)}@seed.com`,
      phone: '+905550001234',
      segment: 'new',
      totalOrders: 1,
      totalSpent: 299.00,
      avgOrder: 299.00,
      riskScore: 'low',
    },
    update: {},
  })

  // Upsert order
  const order = await prisma.order.upsert({
    where: { userId_platformOrderId: { userId, platformOrderId: `SEED_TEST_${userId.slice(0, 6)}` } },
    create: {
      userId,
      customerId: customer.id,
      platformOrderId: `SEED_TEST_${userId.slice(0, 6)}`,
      orderNumber: '#TEST-001',
      status: 'shipped',
      financialStatus: 'paid',
      total: 299.00,
      subtotal: 279.00,
      shipping: 20.00,
      currency: 'TRY',
    },
    update: {},
  })

  await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
  await prisma.orderItem.create({
    data: { orderId: order.id, title: 'Test Ürün', quantity: 1, price: 279.00 },
  })

  // Upsert contact
  const windowExpiresAt = new Date(Date.now() + 20 * 3600000) // 20 saat kaldı (banner test için)
  const contact = await prisma.whatsappContact.upsert({
    where: { userId_phoneNumber: { userId, phoneNumber: '+905550001234' } },
    create: { userId, phoneNumber: '+905550001234', optInStatus: 'OPTED_IN', lastInboundAt: new Date(), windowExpiresAt },
    update: { lastInboundAt: new Date(), windowExpiresAt },
  })

  // Create conversation
  const conv = await prisma.whatsappConversation.create({
    data: {
      contactId: contact.id,
      accountId: account.id,
      status: 'HUMAN_TAKEOVER',
      lastMessageAt: new Date(),
      demo: true,
    },
  })

  // Messages
  const now = Date.now()
  await prisma.whatsappMessage.createMany({
    data: [
      { conversationId: conv.id, direction: 'INBOUND', content: 'Merhaba, siparişim ne zaman gelecek?', status: 'DELIVERED', sentAt: new Date(now - 8 * 60000) },
      { conversationId: conv.id, direction: 'OUTBOUND', content: 'Merhaba Test Müşteri! Siparişinizi kontrol ediyorum, kısa sürede bilgi vereceğim.', status: 'READ', sentAt: new Date(now - 7 * 60000) },
      { conversationId: conv.id, direction: 'INBOUND', content: 'Sipariş numaram #TEST-001. Kargo durumu nedir?', status: 'DELIVERED', sentAt: new Date(now - 2 * 60000) },
    ],
  })

  // AI log
  await prisma.aiDecisionLog.create({
    data: {
      conversationId: conv.id,
      userId,
      intent: 'order_tracking',
      confidence: 0.92,
      knowledgeSource: 'order_data',
      orderDataUsed: true,
      transferred: false,
      action: 'auto_reply',
      responsePreview: 'Merhaba Test Müşteri! Siparişinizi kontrol ediyorum',
    },
  })

  // Note
  await prisma.internalNote.create({
    data: {
      conversationId: conv.id,
      userId,
      note: 'Seed test notu — bu test konuşmasına ait örnek nottur.',
      createdBy: user?.name ?? 'Sistem',
    },
  })

  // Tag
  const tag = await prisma.conversationTag.upsert({
    where: { userId_name: { userId, name: 'Destek' } },
    create: { userId, name: 'Destek', color: '#4470ff' },
    update: {},
  })
  await prisma.conversationTagLink.upsert({
    where: { conversationId_tagId: { conversationId: conv.id, tagId: tag.id } },
    create: { conversationId: conv.id, tagId: tag.id },
    update: {},
  })

  return NextResponse.json({
    ok: true,
    conversationId: conv.id,
    summary: {
      account: account.id,
      customer: customer.name,
      order: order.orderNumber,
      messages: 3,
      aiLog: 1,
      note: 1,
      tag: tag.name,
    },
  })
}
