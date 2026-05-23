export type Segment = 'vip' | 'loyal' | 'at_risk' | 'new' | 'inactive'
export type CampaignType = 'email' | 'sms' | 'whatsapp'
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalOrders: number
  totalSpent: number
  lastOrderDate: string
  segment: Segment
  tags: string[]
  city: string
  joinedDate: string
}

export interface Campaign {
  id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  segment: string
  scheduledAt?: string
  sentAt?: string
  metrics: {
    sent: number
    opened?: number
    clicked: number
    converted: number
    revenue: number
  }
  content: {
    subject?: string
    previewText?: string
    body: string
  }
  createdAt: string
}

export interface RevenuePoint {
  month: string
  total: number
  email: number
  sms: number
  whatsapp: number
  orders: number
}

export interface Automation {
  id: string
  name: string
  trigger: string
  status: 'active' | 'paused' | 'draft'
  channels: CampaignType[]
  triggered: number
  converted: number
  revenue: number
  lastTriggered: string
}

export const customers: Customer[] = [
  {
    id: 'c1', name: 'Ayşe Kaya', email: 'ayse.kaya@gmail.com', phone: '+90 532 111 2233',
    totalOrders: 24, totalSpent: 18650, lastOrderDate: '2026-05-15',
    segment: 'vip', tags: ['sık_alıcı', 'yüksek_değer', 'marka_sadık'], city: 'İstanbul', joinedDate: '2023-03-12',
  },
  {
    id: 'c2', name: 'Mehmet Demir', email: 'mehmet.demir@hotmail.com', phone: '+90 544 222 3344',
    totalOrders: 18, totalSpent: 12400, lastOrderDate: '2026-05-10',
    segment: 'vip', tags: ['sık_alıcı', 'yüksek_değer'], city: 'Ankara', joinedDate: '2023-06-20',
  },
  {
    id: 'c3', name: 'Zeynep Arslan', email: 'zeynep.arslan@gmail.com', phone: '+90 505 333 4455',
    totalOrders: 11, totalSpent: 7820, lastOrderDate: '2026-04-28',
    segment: 'loyal', tags: ['düzenli_alıcı'], city: 'İzmir', joinedDate: '2023-09-05',
  },
  {
    id: 'c4', name: 'Can Yılmaz', email: 'can.yilmaz@gmail.com', phone: '+90 533 444 5566',
    totalOrders: 9, totalSpent: 5340, lastOrderDate: '2026-04-15',
    segment: 'loyal', tags: ['düzenli_alıcı', 'promosyon_duyarlı'], city: 'Bursa', joinedDate: '2023-11-18',
  },
  {
    id: 'c5', name: 'Elif Şahin', email: 'elif.sahin@yahoo.com', phone: '+90 542 555 6677',
    totalOrders: 6, totalSpent: 3200, lastOrderDate: '2026-02-20',
    segment: 'at_risk', tags: ['kaybolma_riski', 'promosyon_duyarlı'], city: 'Antalya', joinedDate: '2024-01-08',
  },
  {
    id: 'c6', name: 'Burak Çelik', email: 'burak.celik@gmail.com', phone: '+90 506 666 7788',
    totalOrders: 4, totalSpent: 1980, lastOrderDate: '2026-01-30',
    segment: 'at_risk', tags: ['kaybolma_riski'], city: 'İstanbul', joinedDate: '2024-02-15',
  },
  {
    id: 'c7', name: 'Selin Öztürk', email: 'selin.ozturk@gmail.com', phone: '+90 531 777 8899',
    totalOrders: 2, totalSpent: 890, lastOrderDate: '2026-05-12',
    segment: 'new', tags: ['yeni_müşteri'], city: 'İstanbul', joinedDate: '2026-04-28',
  },
  {
    id: 'c8', name: 'Emre Aydın', email: 'emre.aydin@gmail.com', phone: '+90 543 888 9900',
    totalOrders: 1, totalSpent: 450, lastOrderDate: '2026-05-18',
    segment: 'new', tags: ['yeni_müşteri', 'sosyal_medya'], city: 'Ankara', joinedDate: '2026-05-16',
  },
  {
    id: 'c9', name: 'Fatma Koç', email: 'fatma.koc@hotmail.com', phone: '+90 507 999 0011',
    totalOrders: 3, totalSpent: 1250, lastOrderDate: '2025-10-05',
    segment: 'inactive', tags: ['pasif_müşteri', 'winback_hedef'], city: 'Konya', joinedDate: '2024-05-20',
  },
  {
    id: 'c10', name: 'Ali Yıldız', email: 'ali.yildiz@gmail.com', phone: '+90 532 000 1122',
    totalOrders: 2, totalSpent: 720, lastOrderDate: '2025-08-15',
    segment: 'inactive', tags: ['pasif_müşteri'], city: 'İzmir', joinedDate: '2024-07-10',
  },
]

export const campaigns: Campaign[] = [
  {
    id: 'camp1',
    name: 'Anneler Günü Email Kampanyası',
    type: 'email',
    status: 'completed',
    segment: 'vip',
    sentAt: '2026-05-08',
    metrics: { sent: 1248, opened: 874, clicked: 312, converted: 87, revenue: 24680 },
    content: {
      subject: '💐 Annenize Özel %30 İndirim — Bu Hafta Sonu Son Gün!',
      previewText: 'En özel günü unutmayın, sevdiklerinizi mutlu edin.',
      body: 'Anneler Günü\'ne özel koleksiyonumuzu keşfedin...',
    },
    createdAt: '2026-05-05',
  },
  {
    id: 'camp2',
    name: 'Sepet Terk SMS Kampanyası',
    type: 'sms',
    status: 'active',
    segment: 'at_risk',
    metrics: { sent: 342, clicked: 128, converted: 41, revenue: 8920 },
    content: {
      body: 'Merhaba! Sepetin sizi bekliyor 🛒 %10 indirim için: marksio.io/sepet',
    },
    createdAt: '2026-05-10',
  },
  {
    id: 'camp3',
    name: 'VIP WhatsApp Özel Teklif',
    type: 'whatsapp',
    status: 'completed',
    segment: 'vip',
    sentAt: '2026-05-01',
    metrics: { sent: 156, clicked: 112, converted: 58, revenue: 31450 },
    content: {
      body: '👑 Merhaba [Ad]! VIP üyemiz olarak size özel bir sürprizimiz var...',
    },
    createdAt: '2026-04-28',
  },
  {
    id: 'camp4',
    name: 'Yaz Koleksiyonu SMS Kampanyası',
    type: 'sms',
    status: 'active',
    segment: 'new',
    metrics: { sent: 2400, clicked: 412, converted: 89, revenue: 14200 },
    content: {
      body: '☀️ Yaz geldi! Yeni sezon ürünlerimiz geldi. %15 indirim için: marksio.io/yaz',
    },
    createdAt: '2026-05-12',
  },
  {
    id: 'camp5',
    name: 'Win-Back Email Serisi',
    type: 'email',
    status: 'scheduled',
    segment: 'inactive',
    scheduledAt: '2026-05-25',
    metrics: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 },
    content: {
      subject: 'Sizi özledik 💜 — Geri dönün, %20 hediye sizi bekliyor',
      previewText: 'Uzun zaman oldu, özel fiyatlarla tekrar buluşalım.',
      body: 'Uzun zamandır görüşemedik...',
    },
    createdAt: '2026-05-18',
  },
  {
    id: 'camp6',
    name: 'Sadık Müşteri Ödül SMS',
    type: 'sms',
    status: 'draft',
    segment: 'loyal',
    metrics: { sent: 0, clicked: 0, converted: 0, revenue: 0 },
    content: {
      body: 'Teşekkürler [Ad]! Sadakatiniz için size 100₺ hediye çeki tanımladık.',
    },
    createdAt: '2026-05-19',
  },
]

export const revenueData: RevenuePoint[] = [
  { month: 'Haz\'25', total: 36600, email: 18500, sms: 9200, whatsapp: 8900, orders: 312 },
  { month: 'Tem\'25', total: 43800, email: 21200, sms: 11400, whatsapp: 11200, orders: 381 },
  { month: 'Ağu\'25', total: 39800, email: 19800, sms: 9800, whatsapp: 10200, orders: 348 },
  { month: 'Eyl\'25', total: 50500, email: 24500, sms: 13200, whatsapp: 12800, orders: 428 },
  { month: 'Eki\'25', total: 61200, email: 29200, sms: 16400, whatsapp: 15600, orders: 512 },
  { month: 'Kas\'25', total: 80700, email: 38500, sms: 21800, whatsapp: 20400, orders: 684 },
  { month: 'Ara\'25', total: 118400, email: 55800, sms: 32400, whatsapp: 30200, orders: 981 },
  { month: 'Oca\'26', total: 56600, email: 26800, sms: 15200, whatsapp: 14600, orders: 468 },
  { month: 'Şub\'26', total: 59200, email: 28100, sms: 15900, whatsapp: 15200, orders: 492 },
  { month: 'Mar\'26', total: 69500, email: 32800, sms: 18800, whatsapp: 17900, orders: 578 },
  { month: 'Nis\'26', total: 75800, email: 35700, sms: 20600, whatsapp: 19500, orders: 634 },
  { month: 'May\'26', total: 89800, email: 42500, sms: 24200, whatsapp: 23100, orders: 748 },
]

export const automations: Automation[] = [
  {
    id: 'auto1',
    name: 'Sepet Terk Akışı',
    trigger: 'Sepet terk edildiğinde',
    status: 'active',
    channels: ['email', 'sms'],
    triggered: 2840,
    converted: 684,
    revenue: 142800,
    lastTriggered: '2026-05-20T09:14:00',
  },
  {
    id: 'auto2',
    name: 'Hoş Geldin Serisi',
    trigger: 'Yeni kayıt sonrası',
    status: 'active',
    channels: ['email', 'whatsapp'],
    triggered: 1240,
    converted: 512,
    revenue: 84600,
    lastTriggered: '2026-05-20T08:42:00',
  },
  {
    id: 'auto3',
    name: 'VIP Doğum Günü',
    trigger: 'Müşteri doğum günü',
    status: 'active',
    channels: ['email', 'whatsapp', 'sms'],
    triggered: 380,
    converted: 215,
    revenue: 48200,
    lastTriggered: '2026-05-19T10:00:00',
  },
  {
    id: 'auto4',
    name: 'Win-Back Akışı',
    trigger: '90 gün satın alma yok',
    status: 'paused',
    channels: ['email'],
    triggered: 620,
    converted: 98,
    revenue: 18400,
    lastTriggered: '2026-05-10T14:20:00',
  },
  {
    id: 'auto5',
    name: 'Sipariş Sonrası Upsell',
    trigger: 'Sipariş tamamlandığında',
    status: 'draft',
    channels: ['email', 'sms'],
    triggered: 0,
    converted: 0,
    revenue: 0,
    lastTriggered: '',
  },
]

export const segmentStats = {
  vip: { count: 892, avgSpent: 14200, label: 'VIP', color: '#7C3AED', desc: '5+ sipariş, ₺10.000+ harcama' },
  loyal: { count: 1840, avgSpent: 5800, label: 'Sadık', color: '#2563EB', desc: '3-5 sipariş, düzenli alıcı' },
  at_risk: { count: 724, avgSpent: 2400, label: 'Risk Altında', color: '#D97706', desc: '60+ gün inaktif' },
  new: { count: 1248, avgSpent: 680, label: 'Yeni', color: '#059669', desc: 'Son 30 günde kayıt' },
  inactive: { count: 1128, avgSpent: 1100, label: 'Pasif', color: '#6B7280', desc: '90+ gün inaktif' },
}

export const storeStats = {
  totalRevenue: 284920,
  revenueGrowth: 12.4,
  totalCustomers: 5832,
  customerGrowth: 8.2,
  activeCampaigns: 7,
  campaignGrowth: 2,
  avgOrderValue: 189,
  aovGrowth: 5.7,
  conversionRate: 3.8,
  emailOpenRate: 42.6,
  smsClickRate: 18.4,
  whatsappReadRate: 87.2,
}
