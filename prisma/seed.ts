import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Seed için direkt bağlantı (pgbouncer pooler'ı değil)
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
})

async function main() {
  const password = await bcrypt.hash('demo1234', 10)

  // Demo hesabı oluştur
  const user = await prisma.user.upsert({
    where: { email: 'demo@demo.com' },
    update: { password },
    create: {
      email: 'demo@demo.com',
      password,
      name: 'Demo Kullanıcı',
      storeName: 'ModaKara',
      plan: 'pro',
    },
  })

  // Temizle ve yeniden oluştur
  await prisma.campaignOpen.deleteMany({ where: { userId: user.id } })
  await prisma.orderItem.deleteMany({ where: { order: { userId: user.id } } })
  await prisma.customerEvent.deleteMany({ where: { userId: user.id } })
  await prisma.order.deleteMany({ where: { userId: user.id } })
  await prisma.campaign.deleteMany({ where: { userId: user.id } })
  await prisma.automation.deleteMany({ where: { userId: user.id } })
  await prisma.segment.deleteMany({ where: { userId: user.id } })
  await prisma.customer.deleteMany({ where: { userId: user.id } })

  // ─── Segmentler ───────────────────────────────────────────────────────────
  await prisma.segment.createMany({
    data: [
      { userId: user.id, name: 'VIP Müşteriler', type: 'builtin', color: 'amber', icon: 'Crown', description: '5+ sipariş, yüksek harcama', count: 142 },
      { userId: user.id, name: 'Sadık Müşteriler', type: 'builtin', color: 'violet', icon: 'Heart', description: '3-5 sipariş, düzenli alıcılar', count: 389 },
      { userId: user.id, name: 'Risk Altında', type: 'builtin', color: 'red', icon: 'AlertTriangle', description: '60+ gün inaktif', count: 203 },
      { userId: user.id, name: 'Yeni Müşteriler', type: 'builtin', color: 'emerald', icon: 'UserPlus', description: 'Son 30 günde kayıt', count: 567 },
      { userId: user.id, name: 'Pasif Müşteriler', type: 'builtin', color: 'gray', icon: 'UserMinus', description: '90+ gün inaktif', count: 312 },
    ],
  })

  // ─── Müşteriler ───────────────────────────────────────────────────────────
  const now = new Date()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000)

  const customerData = [
    { name: 'Ayşe Kara', email: 'ayse.kara@gmail.com', phone: '+90 532 111 2233', segment: 'vip', totalOrders: 12, totalSpent: 18500, avgOrder: 1541, score: 95, tags: '["VIP","Sadık"]', lastOrder: daysAgo(3) },
    { name: 'Mehmet Yılmaz', email: 'mehmet.yilmaz@hotmail.com', phone: '+90 542 222 3344', segment: 'loyal', totalOrders: 5, totalSpent: 4200, avgOrder: 840, score: 72, tags: '["Sadık"]', lastOrder: daysAgo(12) },
    { name: 'Zeynep Demir', email: 'zeynep.d@gmail.com', phone: '+90 555 333 4455', segment: 'at_risk', totalOrders: 3, totalSpent: 1800, avgOrder: 600, score: 35, tags: '["Risk"]', lastOrder: daysAgo(75) },
    { name: 'Ali Çelik', email: 'ali.celik@gmail.com', phone: '+90 543 444 5566', segment: 'new', totalOrders: 1, totalSpent: 450, avgOrder: 450, score: 55, tags: '["Yeni"]', lastOrder: daysAgo(5) },
    { name: 'Fatma Şahin', email: 'fatma.sahin@yandex.com', phone: '+90 532 555 6677', segment: 'vip', totalOrders: 9, totalSpent: 13200, avgOrder: 1466, score: 91, tags: '["VIP"]', lastOrder: daysAgo(7) },
    { name: 'Burak Aydın', email: 'burak.aydin@outlook.com', phone: '+90 544 666 7788', segment: 'inactive', totalOrders: 2, totalSpent: 980, avgOrder: 490, score: 20, tags: '["Pasif"]', lastOrder: daysAgo(110) },
    { name: 'Selin Öztürk', email: 'selin.ozturk@gmail.com', phone: '+90 533 777 8899', segment: 'loyal', totalOrders: 4, totalSpent: 3100, avgOrder: 775, score: 68, tags: '["Sadık"]', lastOrder: daysAgo(18) },
    { name: 'Emre Kılıç', email: 'emre.kilic@gmail.com', phone: '+90 505 888 9900', segment: 'new', totalOrders: 1, totalSpent: 275, avgOrder: 275, score: 50, tags: '["Yeni"]', lastOrder: daysAgo(2) },
    { name: 'Derya Koç', email: 'derya.koc@gmail.com', phone: '+90 542 999 0011', segment: 'vip', totalOrders: 7, totalSpent: 9800, avgOrder: 1400, score: 88, tags: '["VIP","Sadık"]', lastOrder: daysAgo(9) },
    { name: 'Kerem Arslan', email: 'kerem.arslan@hotmail.com', phone: '+90 532 100 2233', segment: 'at_risk', totalOrders: 2, totalSpent: 1200, avgOrder: 600, score: 30, tags: '["Risk"]', lastOrder: daysAgo(65) },
    { name: 'Büşra Yıldız', email: 'busra.yildiz@gmail.com', phone: '+90 546 211 3344', segment: 'loyal', totalOrders: 6, totalSpent: 5400, avgOrder: 900, score: 78, tags: '["Sadık"]', lastOrder: daysAgo(21) },
    { name: 'Mert Doğan', email: 'mert.dogan@gmail.com', phone: '+90 555 322 4455', segment: 'new', totalOrders: 1, totalSpent: 380, avgOrder: 380, score: 52, tags: '["Yeni"]', lastOrder: daysAgo(1) },
  ]

  const createdCustomers = await Promise.all(
    customerData.map(c =>
      prisma.customer.create({ data: { ...c, userId: user.id, source: 'shopify' } })
    )
  )

  // ─── Siparişler ───────────────────────────────────────────────────────────
  const orderStatuses = ['delivered', 'shipped', 'confirmed', 'delivered', 'delivered']
  for (let i = 0; i < createdCustomers.length; i++) {
    const customer = createdCustomers[i]
    const orderCount = customer.totalOrders > 3 ? 3 : customer.totalOrders
    for (let j = 0; j < orderCount; j++) {
      const total = Math.round((customer.avgOrder * (0.8 + Math.random() * 0.4)) / 10) * 10
      await prisma.order.create({
        data: {
          userId: user.id,
          customerId: customer.id,
          orderNumber: `#${1000 + i * 10 + j}`,
          status: orderStatuses[(i + j) % orderStatuses.length],
          financialStatus: 'paid',
          total,
          subtotal: total - 29,
          shipping: 29,
          currency: 'TRY',
          shippingCity: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'][i % 5],
          shippingCountry: 'TR',
          placedAt: daysAgo(j * 18 + Math.floor(Math.random() * 10)),
          items: {
            create: [
              {
                title: ['Siyah Blazer', 'Beyaz Gömlek', 'Kot Pantolon', 'Çizgili Elbise', 'Spor Ayakkabı'][j % 5],
                quantity: 1,
                price: total - 29,
              },
            ],
          },
        },
      })
    }
  }

  // ─── Kampanyalar ──────────────────────────────────────────────────────────
  await prisma.campaign.createMany({
    data: [
      {
        userId: user.id,
        name: 'VIP Özel İndirim',
        type: 'email',
        status: 'active',
        segment: 'vip',
        subject: "Sadece size özel %30 indirim — bugün bitiyor",
        previewText: 'ModaKara VIP üyelerine özel sınırlı süre teklifi',
        body: 'Değerli VIP müşterimiz,\n\nSizin için hazırladığımız özel %30 indirim fırsatı yalnızca bugün geçerli. Yeni koleksiyonumuzdan favori parçalarınızı seçin!\n\nKod: VIP30',
        cta: 'Alışverişe Başla',
        sent: 142, opened: 98, clicked: 45, converted: 18, revenue: 12400,
        tips: '["VIP müşterileri için kişisel dokunuş önemli","Sınırlı süre vurgusu dönüşümü artırır"]',
        createdAt: daysAgo(5),
      },
      {
        userId: user.id,
        name: 'Geri Kazanım Kampanyası',
        type: 'whatsapp',
        status: 'active',
        segment: 'at_risk',
        body: 'Merhaba [Ad]! Sizi çok özledik 💙\n\nSon 60 günde uğramadınız. Sizin için %20 özel indirim hazırladık.\n\nKod: GERI20 — bugün geçerli!',
        cta: 'Geri Dön',
        sent: 203, opened: 156, clicked: 67, converted: 24, revenue: 7200,
        tips: '["Kişiselleştirme dönüşümü artırır","Aciliyet hissi ekleyin"]',
        createdAt: daysAgo(12),
      },
      {
        userId: user.id,
        name: 'Hoş Geldiniz Serisi',
        type: 'email',
        status: 'completed',
        segment: 'new',
        subject: 'ModaKara ailesine hoş geldiniz! İlk siparişinize %10 indirim',
        previewText: 'Yeni üyelere özel hoş geldiniz hediyeniz bekliyor',
        body: 'Merhaba!\n\nModaKara ailesine katıldığınız için çok mutluyuz. İlk siparişinizde %10 indirim kazanın!\n\nKod: HOSGELDIN10',
        cta: 'Keşfet',
        sent: 567, opened: 412, clicked: 198, converted: 89, revenue: 15600,
        tips: '["İlk izlenim çok önemli","Hoş geldiniz kodu dönüşümü artırır"]',
        createdAt: daysAgo(30),
      },
      {
        userId: user.id,
        name: 'Yaz Koleksiyonu Lansmanı',
        type: 'email',
        status: 'draft',
        segment: 'loyal',
        subject: '2025 Yaz Koleksiyonu çıktı — ilk siz görün',
        previewText: 'Sadık müşterilerimize özel erken erişim fırsatı',
        body: 'Sevgili müşterimiz,\n\n2025 Yaz Koleksiyonumuz bugün çıkıyor! Yepyeni renkler ve modeller sizi bekliyor...',
        cta: 'Koleksiyonu Gör',
        sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0,
        tips: '["Lansmanlar heyecan yaratır","Erken erişim ayrıcalık hissi verir"]',
        createdAt: daysAgo(1),
      },
      {
        userId: user.id,
        name: 'Pasif Müşteri Aktivasyonu',
        type: 'whatsapp',
        status: 'draft',
        segment: 'inactive',
        body: 'Merhaba [Ad]! ModaKara\'da çok şey değişti 🛍️\n\nDöndüğünüzde sizi %25 indirimle karşılıyoruz.\n\nKod: DONUS25',
        cta: 'Şimdi Dön',
        sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0,
        tips: '["Pasif müşteriler güçlü teşvik ister","Yeniliklerden bahsedin"]',
        createdAt: daysAgo(2),
      },
    ],
  })

  // ─── Otomasyonlar ─────────────────────────────────────────────────────────
  await prisma.automation.createMany({
    data: [
      {
        userId: user.id,
        name: 'Hoş Geldiniz Serisi',
        trigger: 'new_signup',
        status: 'active',
        segment: 'all',
        steps: JSON.stringify([
          { id: '1', channel: 'email', immediate: true, delayAmount: '0', delayUnit: 'saat', message: 'Hoş geldiniz! İlk alışverişinizde %10 indirim kazanın.' },
          { id: '2', channel: 'whatsapp', immediate: false, delayAmount: '3', delayUnit: 'gün', message: 'Mağazamızı keşfettiniz mi? Yeni koleksiyonumuz sizi bekliyor!' },
        ]),
        sent: 567, opened: 423, converted: 89, revenue: 15600,
      },
      {
        userId: user.id,
        name: 'Terk Edilen Sepet',
        trigger: 'cart_abandon',
        status: 'active',
        segment: 'all',
        steps: JSON.stringify([
          { id: '1', channel: 'email', immediate: false, delayAmount: '1', delayUnit: 'saat', message: 'Sepetinizde ürünler var! Tamamlamak ister misiniz?' },
          { id: '2', channel: 'whatsapp', immediate: false, delayAmount: '24', delayUnit: 'saat', message: 'Son şans! Sepetinizdeki ürünler hâlâ bekliyor.' },
        ]),
        sent: 312, opened: 243, converted: 87, revenue: 24600,
      },
      {
        userId: user.id,
        name: 'Geri Kazanım',
        trigger: 'no_purchase',
        status: 'paused',
        segment: 'at_risk',
        steps: JSON.stringify([
          { id: '1', channel: 'email', immediate: true, delayAmount: '0', delayUnit: 'gün', message: 'Sizi özledik! Size özel %20 indirim.' },
          { id: '2', channel: 'whatsapp', immediate: false, delayAmount: '3', delayUnit: 'gün', message: 'Teklifiniz hâlâ geçerli. Dönmek ister misiniz?' },
        ]),
        sent: 145, opened: 89, converted: 31, revenue: 8400,
      },
      {
        userId: user.id,
        name: 'Sipariş Teslim Sonrası',
        trigger: 'order_complete',
        status: 'active',
        segment: 'all',
        steps: JSON.stringify([
          { id: '1', channel: 'email', immediate: false, delayAmount: '2', delayUnit: 'gün', message: 'Siparişiniz nasıldı? Görüşleriniz bizim için değerli.' },
        ]),
        sent: 423, opened: 312, converted: 45, revenue: 6200,
      },
    ],
  })

  console.log('Demo hesabı oluşturuldu:')
  console.log('  Email: demo@demo.com')
  console.log('  Şifre: demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
