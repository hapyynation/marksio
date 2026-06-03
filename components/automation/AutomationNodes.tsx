'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import {
  ShoppingCart, UserPlus, Package, Eye, CreditCard, Clock,
  Gift, Play, Mail, MessageCircle, Timer, GitBranch, Shuffle,
  Tag, Tags, Layers, Zap, Activity, Settings2, CheckCircle,
  ArrowRight, Webhook,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────── */

export type NodeMeta = {
  badge: string
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
  bgColor: string
}

export type NodeStats = {
  entered?:   number
  completed?: number
  waiting?:   number
  sent?:      number
  opened?:    number
  clicked?:   number
  processed?: number
}

/* ─────────────────────────────────────────────────────────────
   NODE META CONFIG
───────────────────────────────────────────────────────────── */

export const NODE_META: Record<string, NodeMeta> = {
  cart_abandoned:    { badge: 'TETİKLEYİCİ', label: 'Abandoned Cart',    sublabel: 'Sepet terk edildiğinde',           icon: ShoppingCart, color: '#16a34a', bgColor: '#f0fdf4' },
  new_customer:      { badge: 'TETİKLEYİCİ', label: 'Customer Created',  sublabel: 'Müşteri oluşturulduğunda',         icon: UserPlus,     color: '#2563eb', bgColor: '#eff6ff' },
  order_created:     { badge: 'TETİKLEYİCİ', label: 'Order Placed',      sublabel: 'Sipariş oluşturulduğunda',         icon: Package,      color: '#d97706', bgColor: '#fffbeb' },
  tag_added:         { badge: 'TETİKLEYİCİ', label: 'Tag Added',         sublabel: 'Etiket eklendiğinde',              icon: Tag,          color: '#dc2626', bgColor: '#fef2f2' },
  custom_event:      { badge: 'TETİKLEYİCİ', label: 'Custom Event',      sublabel: 'Özel event gerçekleştiğinde',      icon: Settings2,    color: '#7c3aed', bgColor: '#faf5ff' },
  product_viewed:    { badge: 'TETİKLEYİCİ', label: 'Ürün Görüntülendi', sublabel: 'Ürün sayfası ziyaret edildiğinde', icon: Eye,          color: '#0891b2', bgColor: '#ecfeff' },
  checkout_started:  { badge: 'TETİKLEYİCİ', label: 'Ödeme Başlatıldı',  sublabel: 'Ödeme sayfasına geçildiğinde',    icon: CreditCard,   color: '#d97706', bgColor: '#fffbeb' },
  customer_inactive: { badge: 'TETİKLEYİCİ', label: 'Müşteri Pasif',     sublabel: 'Belirli süre aktif olmayan',       icon: Clock,        color: '#dc2626', bgColor: '#fef2f2' },
  birthday:          { badge: 'TETİKLEYİCİ', label: 'Doğum Günü',        sublabel: 'Müşteri doğum günü',               icon: Gift,         color: '#be185d', bgColor: '#fdf2f8' },
  manual_trigger:    { badge: 'TETİKLEYİCİ', label: 'Manuel Tetikle',    sublabel: 'Manuel tetikleme',                 icon: Play,         color: '#7c3aed', bgColor: '#faf5ff' },
  send_email:    { badge: 'E-POSTA',       label: 'Email Gönder',       sublabel: 'E-posta gönder',          icon: Mail,          color: '#4f46e5', bgColor: '#eef2ff' },
  send_whatsapp: { badge: 'WHATSAPP',      label: 'WhatsApp Gönder',    sublabel: 'WhatsApp mesajı gönder',  icon: MessageCircle, color: '#16a34a', bgColor: '#f0fdf4' },
  add_tag:       { badge: 'ETİKET EKLE',   label: 'Etiket Ekle',        sublabel: 'Müşteriye etiket ekle',   icon: Tag,           color: '#d97706', bgColor: '#fffbeb' },
  remove_tag:    { badge: 'ETİKET KALDIR', label: 'Etiket Kaldır',      sublabel: 'Etiketi kaldır',          icon: Tags,          color: '#dc2626', bgColor: '#fef2f2' },
  move_segment:  { badge: 'SEGMENT',       label: 'Segment Ekle/Çıkar', sublabel: 'Segment ekle veya çıkar', icon: Layers,        color: '#7c3aed', bgColor: '#faf5ff' },
  webhook:       { badge: 'WEBHOOK',       label: 'Webhook Çağır',      sublabel: 'Webhook çağrısı yap',     icon: Webhook,       color: '#0d9488', bgColor: '#f0fdfa' },
  wait:       { badge: 'BEKLE',    label: 'Zaman Gecikmesi', sublabel: 'Belirli süre bekle',   icon: Timer,       color: '#d97706', bgColor: '#fffbeb' },
  condition:  { badge: 'KOŞUL',    label: 'Koşul (If/Else)', sublabel: 'Koşullu dallanma',     icon: GitBranch,   color: '#4f46e5', bgColor: '#eef2ff' },
  split_test: { badge: 'A/B TEST', label: 'A/B Test',        sublabel: 'A/B testi oluştur',    icon: Shuffle,     color: '#7c3aed', bgColor: '#faf5ff' },
  stop:       { badge: 'BİTİŞ',   label: 'Akışı Bitir',     sublabel: 'Otomasyonu sonlandır', icon: CheckCircle, color: '#16a34a', bgColor: '#f0fdf4' },
}

export const TRIGGER_NODE_TYPES = [
  'cart_abandoned','new_customer','order_created','tag_added','custom_event',
  'product_viewed','checkout_started','customer_inactive','birthday','manual_trigger',
]
export const ACTION_NODE_TYPES  = ['send_email','send_whatsapp','add_tag','remove_tag','move_segment','webhook']
export const LOGIC_NODE_TYPES   = ['wait','condition','split_test','stop']

export function getNodeMeta(type: string): NodeMeta {
  return NODE_META[type] ?? { badge: 'BLOK', label: type, sublabel: '', icon: Zap, color: '#6b7280', bgColor: '#f9fafb' }
}

export function getReactFlowType(type: string): string {
  if (TRIGGER_NODE_TYPES.includes(type)) return 'triggerNode'
  if (type === 'wait')       return 'waitNode'
  if (type === 'condition')  return 'conditionNode'
  if (type === 'stop')       return 'stopNode'
  if (type === 'split_test') return 'splitTestNode'
  return 'actionNode'
}

export function buildNodeData(type: string) {
  const meta = getNodeMeta(type)
  const base = { type, title: meta.label, description: meta.sublabel, config: {}, stats: {} as NodeStats }
  if (TRIGGER_NODE_TYPES.includes(type)) return { triggerType: type, ...base }
  if (type === 'wait')       return { delayAmount: 1, delayUnit: 'hours', ...base }
  if (type === 'condition')  return { condition: '', ...base }
  if (type === 'stop')       return { ...base }
  if (type === 'split_test') return { ...base, config: { aPercent: 50 } }
  return { actionType: type, ...base }
}

/* ─────────────────────────────────────────────────────────────
   SHARED: Handle style
───────────────────────────────────────────────────────────── */

const hStyle = (color: string, pos: 'top' | 'bottom', offset?: string): React.CSSProperties => ({
  width: 10, height: 10,
  background: color,
  border: '2px solid #ffffff',
  boxShadow: `0 0 0 1.5px ${color}80`,
  ...(pos === 'top'    ? { top: -5 }    : { bottom: -5 }),
  ...(offset ? { left: offset } : {}),
})

/* ─────────────────────────────────────────────────────────────
   SHARED: NodeShell — base card with colored accent
───────────────────────────────────────────────────────────── */

function NodeShell({
  meta, selected, children, width = 258,
}: {
  meta: NodeMeta
  selected?: boolean
  children: React.ReactNode
  width?: number
}) {
  return (
    <div style={{
      width,
      background: '#ffffff',
      borderRadius: 14,
      border: `1.5px solid ${selected ? meta.color + '60' : 'rgba(0,0,0,0.08)'}`,
      boxShadow: selected
        ? `0 0 0 3px ${meta.color}18, 0 8px 32px rgba(0,0,0,0.12)`
        : '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      overflow: 'hidden',
      transition: 'box-shadow 0.16s, border-color 0.16s',
      cursor: 'default',
    }}>
      {/* Colored top accent */}
      <div style={{
        height: 4,
        background: `linear-gradient(90deg, ${meta.color}, ${meta.color}55)`,
      }} />
      {children}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SHARED: NodeHeader — badge + icon + title/subtitle
───────────────────────────────────────────────────────────── */

function NodeHeader({ meta, title, subtitle }: { meta: NodeMeta; title: string; subtitle?: string }) {
  const Icon = meta.icon
  return (
    <div style={{ padding: '10px 13px 11px' }}>
      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: meta.bgColor, borderRadius: 100,
        padding: '2px 7px 2px 5px', marginBottom: 9,
        border: `1px solid ${meta.color}20`,
      }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
        <span style={{ fontSize: 7, fontWeight: 800, color: meta.color, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          {meta.badge}
        </span>
      </div>

      {/* Icon + text */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: meta.bgColor,
          border: `1px solid ${meta.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={15} color={meta.color} strokeWidth={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <p style={{
            margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0f172a',
            lineHeight: 1.3, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</p>
          {subtitle && (
            <p style={{
              margin: '3px 0 0', fontSize: 10, color: '#94a3b8', lineHeight: 1.35,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SHARED: StatRow (single metric)
───────────────────────────────────────────────────────────── */

function StatRow({ label, value, color }: { label: string; value: number; color: string }) {
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n)
  return (
    <div style={{
      padding: '7px 13px',
      borderTop: '1px solid #f1f5f9',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{ fontSize: 9.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {label}
      </span>
      <span style={{ fontSize: 12.5, fontWeight: 800, color: value > 0 ? color : '#d1d5db', fontFamily: 'ui-monospace,monospace' }}>
        {value > 0 ? fmt(value) : '—'}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SHARED: MetricFooter — 3-column email/WA stats
───────────────────────────────────────────────────────────── */

function MetricFooter({ stats }: { stats: NodeStats }) {
  const s = stats.sent    ?? 0
  const o = stats.opened  ?? 0
  const c = stats.clicked ?? 0
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n > 0 ? String(n) : '—'
  const pct = (num: number, den: number) => den > 0 ? `%${((num/den)*100).toFixed(0)}` : ''

  return (
    <div style={{ borderTop: '1px solid #f1f5f9' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          { label: 'Gönderildi', val: fmt(s), sub: '',         col: '#475569' },
          { label: 'Açıldı',     val: fmt(o), sub: pct(o,s),  col: '#16a34a' },
          { label: 'Tıklandı',   val: fmt(c), sub: pct(c,s),  col: '#4f46e5' },
        ].map((m, i) => (
          <div key={m.label} style={{
            textAlign: 'center', padding: '7px 4px',
            borderLeft: i > 0 ? '1px solid #f1f5f9' : 'none',
          }}>
            <p style={{ margin: 0, fontSize: 7, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              {m.label}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 12, fontWeight: 800, color: s > 0 ? m.col : '#e2e8f0', fontFamily: 'ui-monospace,monospace', lineHeight: 1 }}>
              {m.val}
            </p>
            {m.sub && s > 0 && (
              <p style={{ margin: '1px 0 0', fontSize: 8, fontWeight: 600, color: m.col, fontFamily: 'ui-monospace,monospace' }}>
                {m.sub}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TRIGGER NODE
───────────────────────────────────────────────────────────── */

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const meta   = getNodeMeta(data.triggerType)
  const stats  = data.stats as NodeStats
  const entered = stats?.entered ?? 0
  const sublabel = data.config?.segment ? `Segment: ${data.config.segment}` : meta.sublabel

  return (
    <div>
      <NodeShell meta={meta} selected={selected}>
        <NodeHeader meta={meta} title={data.title ?? meta.label} subtitle={sublabel} />
        <StatRow label="Tetiklendi" value={entered} color={meta.color} />
      </NodeShell>
      <Handle type="source" position={Position.Bottom} id="out" style={hStyle(meta.color, 'bottom')} />
    </div>
  )
})
TriggerNode.displayName = 'TriggerNode'

/* ─────────────────────────────────────────────────────────────
   ACTION NODE
───────────────────────────────────────────────────────────── */

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const meta    = getNodeMeta(data.actionType)
  const stats   = data.stats as NodeStats
  const cfg     = data.config ?? {}
  const isEmail = data.actionType === 'send_email'
  const isWA    = data.actionType === 'send_whatsapp'
  const isChannel = isEmail || isWA

  let subtitle = meta.sublabel
  if (isEmail    && cfg.subject)  subtitle = String(cfg.subject)
  else if (isWA  && cfg.message)  subtitle = String(cfg.message).slice(0, 40)
  else if (data.actionType === 'add_tag'      && cfg.tag)     subtitle = `Etiket: #${cfg.tag}`
  else if (data.actionType === 'remove_tag'   && cfg.tag)     subtitle = `Kaldır: #${cfg.tag}`
  else if (data.actionType === 'move_segment' && cfg.segment) subtitle = `→ ${cfg.segment}`
  else if (data.actionType === 'webhook'      && cfg.url)     subtitle = String(cfg.url).slice(0, 36)

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={hStyle(meta.color, 'top')} />
      <NodeShell meta={meta} selected={selected}>
        <NodeHeader meta={meta} title={data.title ?? meta.label} subtitle={subtitle} />
        {isChannel
          ? <MetricFooter stats={stats ?? {}} />
          : <StatRow label="İşlendi" value={stats?.processed ?? 0} color={meta.color} />
        }
      </NodeShell>
      <Handle type="source" position={Position.Bottom} id="out" style={hStyle(meta.color, 'bottom')} />
    </div>
  )
})
ActionNode.displayName = 'ActionNode'

/* ─────────────────────────────────────────────────────────────
   WAIT NODE
───────────────────────────────────────────────────────────── */

export const WaitNode = memo(({ data, selected }: NodeProps) => {
  const meta   = getNodeMeta('wait')
  const amount = data.delayAmount ?? 1
  const unitTR: Record<string, string> = { minutes: 'Dakika', hours: 'Saat', days: 'Gün' }
  const unit   = unitTR[data.delayUnit ?? 'hours'] ?? 'Saat'
  const stats  = data.stats as NodeStats

  return (
    <div>
      <Handle type="target" position={Position.Top}    id="in"  style={hStyle(meta.color, 'top')} />
      <NodeShell meta={meta} selected={selected}>
        <NodeHeader
          meta={meta}
          title={`${amount} ${unit} Bekle`}
          subtitle={`${amount} ${unit.toLowerCase()} sonra devam eder`}
        />
        {/* Timer visual */}
        <div style={{ margin: '0 13px', marginBottom: 10, padding: '6px 10px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Timer size={11} color="#d97706" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706', fontFamily: 'ui-monospace,monospace' }}>
            {amount} {unit.toLowerCase()}
          </span>
          <ArrowRight size={10} color="#d97706" style={{ marginLeft: 'auto' }} />
        </div>
        <StatRow label="Bekliyor" value={stats?.waiting ?? 0} color={meta.color} />
      </NodeShell>
      <Handle type="source" position={Position.Bottom} id="out" style={hStyle(meta.color, 'bottom')} />
    </div>
  )
})
WaitNode.displayName = 'WaitNode'

/* ─────────────────────────────────────────────────────────────
   CONDITION NODE
───────────────────────────────────────────────────────────── */

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const meta = getNodeMeta('condition')
  const condLabels: Record<string, string> = {
    email_opened:    'Mail açıldı mı?',
    purchased:       'Satın aldı mı?',
    clicked:         'Link tıkladı mı?',
    is_vip:          'VIP müşteri mi?',
    order_completed: 'Sipariş tamamlandı mı?',
    no_purchase:     `${data.config?.days ?? 30} gündür satın almadı mı?`,
    total_spent_gt:  `Harcama > ${data.config?.value ?? '0'} ₺`,
    order_count_gt:  `Sipariş > ${data.config?.value ?? '0'}`,
  }
  const condText = condLabels[data.condition ?? ''] ?? (data.condition || 'Koşul seçilmedi')
  const isSet    = !!(data.condition)

  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={Position.Top} id="in" style={hStyle(meta.color, 'top')} />
      <NodeShell meta={meta} selected={selected}>
        <NodeHeader meta={meta} title={data.title ?? meta.label} />
        {/* Condition text */}
        <div style={{ margin: '0 13px 10px', padding: '7px 10px', background: isSet ? '#eef2ff' : '#f8fafc', borderRadius: 8, border: `1px solid ${isSet ? '#c7d2fe' : '#e2e8f0'}` }}>
          <p style={{ margin: 0, fontSize: 10.5, fontWeight: 600, color: isSet ? '#4338ca' : '#94a3b8', textAlign: 'center', lineHeight: 1.3 }}>
            {condText}
          </p>
        </div>
        {/* EVET / HAYIR */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, margin: '0 13px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#f0fdf4', borderRadius: 7, padding: '5px 8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a' }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>EVET</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#fef2f2', borderRadius: 7, padding: '5px 8px', border: '1px solid #fecaca' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626' }} />
            <span style={{ fontSize: 9, fontWeight: 800, color: '#b91c1c', letterSpacing: '0.5px' }}>HAYIR</span>
          </div>
        </div>
      </NodeShell>
      <Handle type="source" position={Position.Bottom} id="yes" style={hStyle('#16a34a', 'bottom', '28%')} />
      <Handle type="source" position={Position.Bottom} id="no"  style={hStyle('#dc2626', 'bottom', '72%')} />
    </div>
  )
})
ConditionNode.displayName = 'ConditionNode'

/* ─────────────────────────────────────────────────────────────
   STOP NODE
───────────────────────────────────────────────────────────── */

export const StopNode = memo(({ data, selected }: NodeProps) => {
  const meta  = getNodeMeta('stop')
  const stats = data.stats as NodeStats
  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={hStyle(meta.color, 'top')} />
      <NodeShell meta={meta} selected={selected}>
        <NodeHeader meta={meta} title={data.title ?? 'Otomasyon Sonlandı'} subtitle="Müşteri akışı tamamladı" />
        <StatRow label="Tamamladı" value={stats?.completed ?? 0} color={meta.color} />
      </NodeShell>
    </div>
  )
})
StopNode.displayName = 'StopNode'

/* ─────────────────────────────────────────────────────────────
   SPLIT TEST NODE
───────────────────────────────────────────────────────────── */

export const SplitTestNode = memo(({ data, selected }: NodeProps) => {
  const meta     = getNodeMeta('split_test')
  const aPercent = data.config?.aPercent ?? 50
  const bPercent = 100 - aPercent

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={hStyle(meta.color, 'top')} />
      <NodeShell meta={meta} selected={selected}>
        <NodeHeader meta={meta} title={data.title ?? 'A/B Testi'} subtitle={`A: %${aPercent} — B: %${bPercent}`} />
        {/* Split bar */}
        <div style={{ margin: '0 13px 12px' }}>
          <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', height: 7, gap: 1.5 }}>
            <div style={{ flex: aPercent, background: 'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius: '3px 0 0 3px' }} />
            <div style={{ flex: bPercent, background: 'linear-gradient(90deg,#2563eb,#3b82f6)', borderRadius: '0 3px 3px 0' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#16a34a' }}>A — %{aPercent}</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#2563eb' }}>B — %{bPercent}</span>
          </div>
        </div>
      </NodeShell>
      <Handle type="source" position={Position.Bottom} id="a" style={hStyle('#16a34a', 'bottom', '28%')} />
      <Handle type="source" position={Position.Bottom} id="b" style={hStyle('#2563eb', 'bottom', '72%')} />
    </div>
  )
})
SplitTestNode.displayName = 'SplitTestNode'

/* ─────────────────────────────────────────────────────────────
   REACTFLOW NODE TYPES MAP
───────────────────────────────────────────────────────────── */

export const NODE_TYPES = {
  triggerNode:   TriggerNode,
  actionNode:    ActionNode,
  waitNode:      WaitNode,
  conditionNode: ConditionNode,
  stopNode:      StopNode,
  splitTestNode: SplitTestNode,
}
