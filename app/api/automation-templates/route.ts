import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/* ─── Template flow data ──────────────────────────────────────── */

type FlowData = {
  nodes: {
    id: string
    type: string
    position: { x: number; y: number }
    data: Record<string, unknown>
  }[]
  edges: {
    id: string
    source: string
    target: string
    sourceHandle?: string
    type: string
    markerEnd?: { type: string; color: string; width: number; height: number }
    style?: Record<string, unknown>
    animated?: boolean
  }[]
}

const EDGE = (id: string, source: string, target: string, sourceHandle?: string) => ({
  id,
  source,
  target,
  ...(sourceHandle ? { sourceHandle } : {}),
  type: 'smoothstep',
  animated: false,
  markerEnd: { type: 'arrowclosed', color: '#6366f1', width: 14, height: 14 },
  style: { stroke: '#6366f1', strokeWidth: 2, opacity: 0.45 },
})

function triggerNode(id: string, triggerType: string, label: string, desc: string, pos: { x: number; y: number }) {
  return {
    id,
    type: 'triggerNode',
    position: pos,
    data: { triggerType, type: triggerType, title: label, description: desc, config: {}, stats: {} },
  }
}

function waitNode(id: string, amount: number, unit: string, pos: { x: number; y: number }) {
  const unitLabel = unit === 'hours' ? 'Saat' : unit === 'days' ? 'Gün' : 'Dakika'
  return {
    id,
    type: 'waitNode',
    position: pos,
    data: { type: 'wait', title: `${amount} ${unitLabel} Bekle`, description: 'Belirli süre bekle', delayAmount: amount, delayUnit: unit, config: {}, stats: {} },
  }
}

function conditionNode(id: string, condition: string, label: string, config: Record<string, unknown>, pos: { x: number; y: number }) {
  return {
    id,
    type: 'conditionNode',
    position: pos,
    data: { type: 'condition', title: label, description: 'Koşullu dallanma', condition, config, stats: {} },
  }
}

function emailNode(id: string, subject: string, body: string, pos: { x: number; y: number }) {
  return {
    id,
    type: 'actionNode',
    position: pos,
    data: {
      actionType: 'send_email',
      type: 'send_email',
      title: 'Email Gönder',
      description: 'E-posta gönder',
      config: { subject, body, senderName: 'Mağaza' },
      stats: {},
    },
  }
}

function whatsAppNode(id: string, message: string, pos: { x: number; y: number }) {
  return {
    id,
    type: 'actionNode',
    position: pos,
    data: {
      actionType: 'send_whatsapp',
      type: 'send_whatsapp',
      title: 'WhatsApp Gönder',
      description: 'WhatsApp mesajı gönder',
      config: { message },
      stats: {},
    },
  }
}

function tagNode(id: string, tag: string, pos: { x: number; y: number }) {
  return {
    id,
    type: 'actionNode',
    position: pos,
    data: {
      actionType: 'add_tag',
      type: 'add_tag',
      title: `Etiket Ekle: ${tag}`,
      description: 'Müşteriye etiket ekle',
      config: { tag },
      stats: {},
    },
  }
}

function stopNode(id: string, pos: { x: number; y: number }) {
  return {
    id,
    type: 'stopNode',
    position: pos,
    data: { type: 'stop', title: 'Akışı Bitir', description: 'Otomasyonu sonlandır', config: {}, stats: {} },
  }
}

/* ─── Template definitions ───────────────────────────────────── */

export type AutomationTemplate = {
  id: string
  name: string
  description: string
  trigger: string
  icon: string
  color: string
  category: string
  expectedRevenue: string
  setupTime: string
  pro?: boolean
  isNew?: boolean
  flowData: FlowData
}

const TEMPLATES: AutomationTemplate[] = [
  /* ── 1. Sepet Terk ──────────────────────────────────────── */
  {
    id: 'cart_abandoned',
    name: 'Sepet Terk',
    description: 'Sepetini terk eden müşterileri geri kazanın.',
    trigger: 'cart_abandoned',
    icon: 'ShoppingCart',
    color: '#22c97a',
    category: 'recovery',
    expectedRevenue: '₺98.750',
    setupTime: '5 dk',
    flowData: {
      nodes: [
        triggerNode('t1', 'cart_abandoned', 'Abandoned Cart', 'Sepet terk edildiğinde', { x: 300, y: 80 }),
        waitNode('w1', 1, 'hours', { x: 300, y: 260 }),
        emailNode('a1',
          '{{firstName}}, sepetinizi unutmadık!',
          'Merhaba {{firstName}},\n\nSepetinizde ürünler bekliyorsa geri dönün ve alışverişinizi tamamlayın. Her şey sizi bekliyor!\n\nHemen tamamla →',
          { x: 300, y: 440 }
        ),
        waitNode('w2', 24, 'hours', { x: 300, y: 620 }),
        conditionNode('c1', 'purchased', 'Satın Aldı mı?', {}, { x: 300, y: 800 }),
        stopNode('s1', { x: 80, y: 980 }),
        emailNode('a2',
          '{{firstName}}, son fırsat! Sepetiniz için %10 indirim',
          'Merhaba {{firstName}},\n\nSepetinizdeki ürünleri satın almak için size özel %10 indirim! Bu fırsat sadece bugün geçerli.\n\nKOD: SEPET10\n\nHemen tamamla →',
          { x: 520, y: 980 }
        ),
        stopNode('s2', { x: 520, y: 1160 }),
      ],
      edges: [
        EDGE('e1', 't1', 'w1'),
        EDGE('e2', 'w1', 'a1'),
        EDGE('e3', 'a1', 'w2'),
        EDGE('e4', 'w2', 'c1'),
        EDGE('e5', 'c1', 's1', 'yes'),
        EDGE('e6', 'c1', 'a2', 'no'),
        EDGE('e7', 'a2', 's2'),
      ],
    },
  },

  /* ── 2. Hoş Geldin Serisi ────────────────────────────────── */
  {
    id: 'welcome_series',
    name: 'Hoş Geldin Serisi',
    description: 'Yeni abonelere harika bir başlangıç yapın.',
    trigger: 'new_customer',
    icon: 'UserPlus',
    color: '#4470ff',
    category: 'onboarding',
    expectedRevenue: '₺64.320',
    setupTime: '3 dk',
    flowData: {
      nodes: [
        triggerNode('t1', 'new_customer', 'Customer Created', 'Müşteri oluşturulduğunda', { x: 300, y: 80 }),
        emailNode('a1',
          '{{firstName}}, mağazamıza hoş geldiniz!',
          'Merhaba {{firstName}},\n\nMağazamıza hoş geldiniz! Sizi aramızda görmek harika.\n\nİlk alışverişinizde %5 indirim kazanmak için HOSGELDIN5 kodunu kullanın.\n\nAlışverişe başla →',
          { x: 300, y: 260 }
        ),
        waitNode('w1', 1, 'days', { x: 300, y: 440 }),
        emailNode('a2',
          'Mağazamızı keşfedin {{firstName}}',
          'Merhaba {{firstName}},\n\nMağazamızda neler var biliyor musunuz? En popüler ürünlerimizi keşfedin ve size en uygun olanı bulun!\n\nÜrünleri gör →',
          { x: 300, y: 620 }
        ),
        waitNode('w2', 3, 'days', { x: 300, y: 800 }),
        emailNode('a3',
          '{{firstName}}, özel bir teklifimiz var!',
          'Merhaba {{firstName}},\n\nSizi daha iyi tanımak istiyoruz. İlk siparişinizde ücretsiz kargo fırsatını kaçırmayın!\n\nHemen alışveriş yap →',
          { x: 300, y: 980 }
        ),
        stopNode('s1', { x: 300, y: 1160 }),
      ],
      edges: [
        EDGE('e1', 't1', 'a1'),
        EDGE('e2', 'a1', 'w1'),
        EDGE('e3', 'w1', 'a2'),
        EDGE('e4', 'a2', 'w2'),
        EDGE('e5', 'w2', 'a3'),
        EDGE('e6', 'a3', 's1'),
      ],
    },
  },

  /* ── 3. Sipariş Sonrası Teşekkür ────────────────────────── */
  {
    id: 'post_order_thank_you',
    name: 'Sipariş Sonrası Teşekkür',
    description: 'Her siparişten sonra müşteriye teşekkür edin.',
    trigger: 'order_created',
    icon: 'Package',
    color: '#f0a020',
    category: 'post_purchase',
    expectedRevenue: '₺42.180',
    setupTime: '4 dk',
    flowData: {
      nodes: [
        triggerNode('t1', 'order_created', 'Order Placed', 'Sipariş oluşturulduğunda', { x: 300, y: 80 }),
        waitNode('w1', 1, 'hours', { x: 300, y: 260 }),
        emailNode('a1',
          '{{firstName}}, siparişiniz için teşekkürler!',
          'Merhaba {{firstName}},\n\nSiparişiniz ({{siparis_no}}) başarıyla alındı!\n\nSiparişinizi hazırlıyoruz ve en kısa sürede kargoya vereceğiz. Takip numaranızı ayrıca paylaşacağız.\n\nTeşekkürler →',
          { x: 300, y: 440 }
        ),
        waitNode('w2', 7, 'days', { x: 300, y: 620 }),
        emailNode('a2',
          '{{firstName}}, ürünü beğendiniz mi?',
          'Merhaba {{firstName}},\n\nSiparişinizi teslim aldığınızı umuyoruz! Ürün hakkında ne düşündüğünüzü merak ediyoruz.\n\nYorumunuzu paylaşır mısınız? Değerlendirmeniz diğer müşterilere yol gösterecek.\n\nYorum yaz →',
          { x: 300, y: 800 }
        ),
        stopNode('s1', { x: 300, y: 980 }),
      ],
      edges: [
        EDGE('e1', 't1', 'w1'),
        EDGE('e2', 'w1', 'a1'),
        EDGE('e3', 'a1', 'w2'),
        EDGE('e4', 'w2', 'a2'),
        EDGE('e5', 'a2', 's1'),
      ],
    },
  },

  /* ── 4. Winback Kampanyası ───────────────────────────────── */
  {
    id: 'winback',
    name: 'Winback Kampanyası',
    description: 'Uzun süredir alışveriş yapmayanları geri kazanın.',
    trigger: 'customer_inactive',
    icon: 'Tag',
    color: '#22c97a',
    category: 'retention',
    expectedRevenue: '₺112.350',
    setupTime: '5 dk',
    flowData: {
      nodes: [
        triggerNode('t1', 'customer_inactive', 'Müşteri Pasif', 'Belirli süre aktif olmayan', { x: 300, y: 80 }),
        emailNode('a1',
          '{{firstName}}, sizi özledik!',
          'Merhaba {{firstName}},\n\nBir süredir sizi aramızda göremedik. Yeni ürünlerimiz ve özel fırsatlarla sizi bekliyoruz!\n\nSizi özel hissettirecek bir sürprizimiz var. Hemen keşfedin →',
          { x: 300, y: 260 }
        ),
        waitNode('w1', 7, 'days', { x: 300, y: 440 }),
        conditionNode('c1', 'no_purchase', 'Hâlâ Satın Almadı mı?', { days: 37 }, { x: 300, y: 620 }),
        whatsAppNode('a2',
          'Merhaba {{firstName}}! 🎁 Sizi özledik. Bugün için özel bir teklifimiz var: Tüm ürünlerde %15 indirim! Fırsatı kaçırmayın →',
          { x: 520, y: 800 }
        ),
        stopNode('s1', { x: 80, y: 800 }),
        stopNode('s2', { x: 520, y: 980 }),
      ],
      edges: [
        EDGE('e1', 't1', 'a1'),
        EDGE('e2', 'a1', 'w1'),
        EDGE('e3', 'w1', 'c1'),
        EDGE('e4', 'c1', 's1', 'no'),
        EDGE('e5', 'c1', 'a2', 'yes'),
        EDGE('e6', 'a2', 's2'),
      ],
    },
  },

  /* ── 5. VIP Müşteri ──────────────────────────────────────── */
  {
    id: 'vip_customer',
    name: 'VIP Müşteri Akışı',
    description: 'VIP müşterilerinize özel deneyimler sunun.',
    trigger: 'order_created',
    icon: 'Crown',
    color: '#9f7afa',
    category: 'loyalty',
    expectedRevenue: '₺126.880',
    setupTime: '6 dk',
    pro: true,
    flowData: {
      nodes: [
        triggerNode('t1', 'order_created', 'Order Placed', 'Sipariş oluşturulduğunda', { x: 300, y: 80 }),
        conditionNode('c1', 'total_spent_gt', '₺2000+ Harcadı mı?', { value: 2000 }, { x: 300, y: 260 }),
        stopNode('s1', { x: 80, y: 440 }),
        tagNode('a1', 'vip', { x: 520, y: 440 }),
        emailNode('a2',
          '{{firstName}}, VIP üyeliğinize hoş geldiniz! 👑',
          'Merhaba {{firstName}},\n\nMağazamıza olan sadakatiniz için teşekkür ederiz! Artık siz de VIP müşterilerimizden birisiniz.\n\nVIP ayrıcalıklarınız:\n• Her siparişte öncelikli kargo\n• Aylık özel teklifler\n• Yeni ürünlerde erken erişim\n\nVIP avantajlarınızı kullanmaya başlayın →',
          { x: 520, y: 620 }
        ),
        stopNode('s2', { x: 520, y: 800 }),
      ],
      edges: [
        EDGE('e1', 't1', 'c1'),
        EDGE('e2', 'c1', 's1', 'no'),
        EDGE('e3', 'c1', 'a1', 'yes'),
        EDGE('e4', 'a1', 'a2'),
        EDGE('e5', 'a2', 's2'),
      ],
    },
  },

  /* ── 6. Doğum Günü ───────────────────────────────────────── */
  {
    id: 'birthday',
    name: 'Doğum Günü Kampanyası',
    description: 'Doğum gününde özel teklifler gönderin.',
    trigger: 'birthday',
    icon: 'Gift',
    color: '#f0a020',
    category: 'engagement',
    expectedRevenue: '₺28.650',
    setupTime: '4 dk',
    flowData: {
      nodes: [
        triggerNode('t1', 'birthday', 'Doğum Günü', 'Müşteri doğum günü', { x: 300, y: 80 }),
        emailNode('a1',
          '{{firstName}}, mutlu yıllar! 🎂',
          'Merhaba {{firstName}},\n\nDoğum gününüz kutlu olsun! Bu özel günde size küçük bir sürprizimiz var.\n\nBugüne özel %20 indirim kuponu:\nKOD: DOGUMGUNU20\n\nKullan →',
          { x: 300, y: 260 }
        ),
        waitNode('w1', 3, 'days', { x: 300, y: 440 }),
        conditionNode('c1', 'purchased', 'Kuponu Kullandı mı?', {}, { x: 300, y: 620 }),
        stopNode('s1', { x: 80, y: 800 }),
        emailNode('a2',
          '{{firstName}}, doğum günü indiriminiz son gün!',
          'Merhaba {{firstName}},\n\nDoğum günü indiriminizin son günü! %20 indirim kodunuz DOGUMGUNU20 bugün sona eriyor.\n\nKaçırmayın →',
          { x: 520, y: 800 }
        ),
        stopNode('s2', { x: 520, y: 980 }),
      ],
      edges: [
        EDGE('e1', 't1', 'a1'),
        EDGE('e2', 'a1', 'w1'),
        EDGE('e3', 'w1', 'c1'),
        EDGE('e4', 'c1', 's1', 'yes'),
        EDGE('e5', 'c1', 'a2', 'no'),
        EDGE('e6', 'a2', 's2'),
      ],
    },
  },

  /* ── 7. İlk Sipariş Sonrası Takip ───────────────────────── */
  {
    id: 'first_order_followup',
    name: 'İlk Sipariş Sonrası Takip',
    description: 'İlk siparişten sonra uzun vadeli ilişki kurun.',
    trigger: 'order_created',
    icon: 'Package',
    color: '#4470ff',
    category: 'post_purchase',
    expectedRevenue: '₺51.200',
    setupTime: '4 dk',
    isNew: true,
    flowData: {
      nodes: [
        triggerNode('t1', 'order_created', 'Order Placed', 'Sipariş oluşturulduğunda', { x: 300, y: 80 }),
        conditionNode('c1', 'order_count_gt', 'İlk Sipariş mi?', { value: 1 }, { x: 300, y: 260 }),
        stopNode('s1', { x: 80, y: 440 }),
        waitNode('w1', 3, 'days', { x: 520, y: 440 }),
        emailNode('a1',
          '{{firstName}}, ilk siparişiniz için özel fırsat!',
          'Merhaba {{firstName}},\n\nİlk alışverişiniz için çok teşekkür ederiz! Bizi tercih ettiğinize sevindik.\n\nSadık müşterilerimize özel: İkinci alışverişinizde %15 indirim!\nKOD: IKINCISIPARIS15\n\nHemen alışveriş yap →',
          { x: 520, y: 620 }
        ),
        stopNode('s2', { x: 520, y: 800 }),
      ],
      edges: [
        EDGE('e1', 't1', 'c1'),
        EDGE('e2', 'c1', 's1', 'yes'),
        EDGE('e3', 'c1', 'w1', 'no'),
        EDGE('e4', 'w1', 'a1'),
        EDGE('e5', 'a1', 's2'),
      ],
    },
  },

  /* ── 8. WhatsApp Hatırlatma ──────────────────────────────── */
  {
    id: 'whatsapp_cart_reminder',
    name: 'WhatsApp Hatırlatma',
    description: 'Sepet terklerinde WhatsApp ile anında ulaşın.',
    trigger: 'cart_abandoned',
    icon: 'MessageCircle',
    color: '#22c97a',
    category: 'recovery',
    expectedRevenue: '₺73.500',
    setupTime: '3 dk',
    isNew: true,
    flowData: {
      nodes: [
        triggerNode('t1', 'cart_abandoned', 'Abandoned Cart', 'Sepet terk edildiğinde', { x: 300, y: 80 }),
        waitNode('w1', 2, 'hours', { x: 300, y: 260 }),
        conditionNode('c1', 'purchased', 'Satın Aldı mı?', {}, { x: 300, y: 440 }),
        stopNode('s1', { x: 80, y: 620 }),
        whatsAppNode('a1',
          'Merhaba {{firstName}}! 🛒 Sepetinizdeki ürünler sizi bekliyor. Alışverişinizi tamamlamak için hemen tıklayın: {{url}}',
          { x: 520, y: 620 }
        ),
        stopNode('s2', { x: 520, y: 800 }),
      ],
      edges: [
        EDGE('e1', 't1', 'w1'),
        EDGE('e2', 'w1', 'c1'),
        EDGE('e3', 'c1', 's1', 'yes'),
        EDGE('e4', 'c1', 'a1', 'no'),
        EDGE('e5', 'a1', 's2'),
      ],
    },
  },
]

/* ─── GET /api/automation-templates ──────────────────────────── */

export async function GET() {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  return NextResponse.json(
    TEMPLATES.map(({ flowData: _fd, ...rest }) => rest),
  )
}

/* ─── POST /api/automation-templates ─────────────────────────── */

export async function POST(req: NextRequest) {
  const session = await getApiSession()
  if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  const userId = (session.user as { id: string }).id

  const { templateId } = await req.json() as { templateId: string }
  const template = TEMPLATES.find(t => t.id === templateId)
  if (!template) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 })

  try {
    const existing = await prisma.automation.findFirst({
      where: { userId, name: template.name },
      select: { id: true, name: true },
    })
    if (existing) {
      return NextResponse.json({ id: existing.id, name: existing.name }, { status: 200 })
    }

    const automation = await prisma.automation.create({
      data: {
        userId,
        name:     template.name,
        trigger:  template.trigger,
        status:   'draft',
        steps:    '[]',
        flowData: JSON.stringify(template.flowData),
      },
    })

    return NextResponse.json({ id: automation.id, name: automation.name }, { status: 201 })
  } catch (err) {
    console.error('[AutomationTemplates POST]', err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
