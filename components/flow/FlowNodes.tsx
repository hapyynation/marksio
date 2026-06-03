'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import {
  ShoppingCart, UserPlus, Package, Eye, CreditCard, Clock,
  Gift, Play, Mail, MessageCircle, Timer, GitBranch, Shuffle,
  Tag, Tags, Layers, Zap, Activity, Settings2, CheckCircle,
} from 'lucide-react'

export type NodeMeta = {
  type: string
  label: string
  sublabel: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}

export const TRIGGER_TYPES: NodeMeta[] = [
  { type: 'cart_abandoned',    label: 'Abandoned Cart',      sublabel: 'Sepet terk edildiğinde',           icon: ShoppingCart, color: '#22c97a', bg: 'rgba(34,201,122,0.12)',  border: 'rgba(34,201,122,0.3)'  },
  { type: 'new_customer',      label: 'Customer Created',    sublabel: 'Müşteri oluşturulduğunda',         icon: UserPlus,     color: '#99b4ff', bg: 'rgba(153,180,255,0.12)', border: 'rgba(153,180,255,0.3)' },
  { type: 'order_created',     label: 'Order Placed',        sublabel: 'Sipariş oluşturulduğunda',         icon: Package,      color: '#f0a020', bg: 'rgba(240,160,32,0.12)',  border: 'rgba(240,160,32,0.3)'  },
  { type: 'tag_added',         label: 'Tag Added',           sublabel: 'Etiket eklendiğinde',              icon: Tag,          color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
  { type: 'custom_event',      label: 'Custom Event',        sublabel: 'Özel bir event gerçekleştiğinde',  icon: Settings2,    color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
  { type: 'product_viewed',    label: 'Ürün Görüntülendi',   sublabel: 'Ürün sayfası ziyaret edildiğinde', icon: Eye,          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)'   },
  { type: 'checkout_started',  label: 'Ödeme Başlatıldı',    sublabel: 'Ödeme sayfasına geçildiğinde',     icon: CreditCard,   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)'  },
  { type: 'customer_inactive', label: 'Müşteri Pasif',       sublabel: 'Belirli süre aktif olmayan',       icon: Clock,        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)'   },
  { type: 'birthday',          label: 'Doğum Günü',          sublabel: 'Müşteri doğum günü',               icon: Gift,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  border: 'rgba(236,72,153,0.3)'  },
  { type: 'manual_trigger',    label: 'Manuel Tetikle',      sublabel: 'Manüel tetikleme',                 icon: Play,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)' },
]

export const ACTION_TYPES: NodeMeta[] = [
  { type: 'send_email',    label: 'Email Gönder',       sublabel: 'E-posta gönder',            icon: Mail,          color: '#99b4ff', bg: 'rgba(153,180,255,0.10)', border: 'rgba(153,180,255,0.25)' },
  { type: 'send_whatsapp', label: 'WhatsApp Gönder',    sublabel: 'WhatsApp mesajı gönder',    icon: MessageCircle, color: '#25d366', bg: 'rgba(37,211,102,0.10)',  border: 'rgba(37,211,102,0.25)'  },
{ type: 'add_tag',       label: 'Etiket Ekle',        sublabel: 'Müşteriye etiket ekle',     icon: Tag,           color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)'  },
  { type: 'remove_tag',    label: 'Etiket Kaldır',      sublabel: 'Etiketi kaldır',            icon: Tags,          color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
  { type: 'move_segment',  label: 'Segment Ekle/Çıkar', sublabel: 'Segment ekle veya çıkar',   icon: Layers,        color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)' },
  { type: 'webhook',       label: 'Webhook Çağır',      sublabel: 'Webhook çağrısı yap',       icon: Activity,      color: '#2dd4bf', bg: 'rgba(45,212,191,0.10)',  border: 'rgba(45,212,191,0.25)'  },
]

export const LOGIC_TYPES: NodeMeta[] = [
  { type: 'wait',       label: 'Zaman Gecikmesi', sublabel: 'Belirli süre bekle',    icon: Timer,       color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)'  },
  { type: 'condition',  label: 'Koşul (If/Else)', sublabel: 'Koşullu dallanma',      icon: GitBranch,   color: '#4470ff', bg: 'rgba(68,112,255,0.10)',  border: 'rgba(68,112,255,0.25)'  },
  { type: 'split_test', label: 'A/B Test',        sublabel: 'A/B testi oluştur',     icon: Shuffle,     color: '#9f7afa', bg: 'rgba(159,122,250,0.10)', border: 'rgba(159,122,250,0.25)' },
  { type: 'stop',       label: 'Akışı Bitir',     sublabel: 'Otomasyonu sonlandır',  icon: CheckCircle, color: '#22c97a', bg: 'rgba(34,201,122,0.10)',  border: 'rgba(34,201,122,0.25)'  },
]

export function getNodeMeta(type: string): NodeMeta {
  return (
    TRIGGER_TYPES.find(t => t.type === type) ||
    ACTION_TYPES.find(t => t.type === type) ||
    LOGIC_TYPES.find(t => t.type === type) ||
    { type, label: type, sublabel: '', icon: Zap, color: '#8b95a8', bg: 'rgba(139,149,168,0.10)', border: 'rgba(139,149,168,0.25)' }
  )
}

/* ── Shared node card ──────────────────────────────────────── */

function NodeCard({ icon: Icon, label, sublabel, color, bg, border, selected, typeLabel, children }: {
  icon: React.ElementType; label: string; sublabel?: string
  color: string; bg: string; border: string; selected?: boolean
  typeLabel?: string; children?: React.ReactNode
}) {
  return (
    <div style={{
      background: selected ? 'rgba(20,22,34,0.98)' : 'rgba(13,15,24,0.97)',
      border: `1.5px solid ${selected ? color : border}`,
      borderRadius: 14, padding: '11px 13px',
      minWidth: 192, maxWidth: 228,
      cursor: 'default',
      backdropFilter: 'blur(12px)',
      boxShadow: selected
        ? `0 0 0 2.5px ${color}20, 0 6px 20px rgba(0,0,0,0.55)`
        : '0 3px 14px rgba(0,0,0,0.38)',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      {typeLabel && (
        <div style={{ fontSize: 8.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '1.6px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
          {typeLabel}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 31, height: 31, borderRadius: 8, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={14} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#e2e8f8', lineHeight: 1.3 }}>{label}</p>
          {sublabel && <p style={{ margin: 0, fontSize: 9.5, color: '#6a7080', lineHeight: 1.3, marginTop: 3 }}>{sublabel}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

/* ── Channel stats (email/whatsapp) ────────────────────────── */

function ChannelStats({ stats }: { stats?: { sent?: number; opened?: number; clicked?: number } }) {
  if (!stats?.sent) return null
  const openRate  = stats.sent && stats.opened  ? ((stats.opened  / stats.sent) * 100).toFixed(1) : '0.0'
  const clickRate = stats.sent && stats.clicked ? ((stats.clicked / stats.sent) * 100).toFixed(1) : '0.0'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      {[
        { label: 'Gönderildi', value: stats.sent,        rate: null,      color: '#8b95a8' },
        { label: 'Açıldı',     value: stats.opened ?? 0, rate: openRate,  color: '#22c97a' },
        { label: 'Tıklandı',   value: stats.clicked ?? 0, rate: clickRate, color: '#99b4ff' },
      ].map((col, i) => (
        <div key={col.label} style={{ textAlign: 'center', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', padding: '0 3px' }}>
          <p style={{ margin: 0, fontSize: 8, color: '#4a5060', fontWeight: 600 }}>{col.label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 10.5, fontWeight: 800, color: col.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.2 }}>
            {col.value?.toLocaleString('tr') ?? '0'}
          </p>
          {col.rate !== null && (
            <p style={{ margin: 0, fontSize: 8, color: col.rate !== '0.0' ? '#22c97a' : '#4a5060', fontFamily: 'JetBrains Mono, monospace' }}>%{col.rate}</p>
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Trigger Node ──────────────────────────────────────────── */

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const meta = getNodeMeta(data.triggerType)
  const Icon = meta.icon
  const sublabel = data.config?.segment ? `Segment: ${data.config.segment}` : meta.sublabel

  return (
    <div>
      <NodeCard icon={Icon} label={data.label ?? meta.label} sublabel={sublabel} color={meta.color} bg={meta.bg} border={meta.border} selected={selected} typeLabel="TETİKLEYİCİ">
        {data.stats?.entered > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 8.5, color: '#4a5060' }}>Tetiklendi</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, fontFamily: 'JetBrains Mono, monospace' }}>{data.stats.entered.toLocaleString('tr')}</span>
          </div>
        )}
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="out" style={{ background: meta.color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5 }} />
    </div>
  )
})
TriggerNode.displayName = 'TriggerNode'

/* ── Action Node ───────────────────────────────────────────── */

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const meta = getNodeMeta(data.actionType)
  const Icon = meta.icon

  const typeLabels: Record<string, string> = {
    send_email: 'E-POSTA', send_whatsapp: 'WHATSAPP',
    add_tag: 'ETİKET', remove_tag: 'ETİKET KALDIR', move_segment: 'SEGMENT',
    webhook: 'WEBHOOK',
  }
  const typeLabel = typeLabels[data.actionType] ?? 'AKSİYON'

  let sublabel = meta.sublabel
  if (data.actionType === 'send_email'    && data.config?.subject)  sublabel = data.config.subject.slice(0, 30)
  else if (data.actionType === 'send_whatsapp' && data.config?.message) sublabel = data.config.message.slice(0, 30)
  else if (data.actionType === 'add_tag'       && data.config?.tag)     sublabel = `#${data.config.tag}`
  else if (data.actionType === 'move_segment'  && data.config?.segment) sublabel = `→ ${data.config.segment}`
  else if (data.actionType === 'webhook'       && data.config?.url)     sublabel = data.config.url.slice(0, 30)

  const isChannel = ['send_email', 'send_whatsapp'].includes(data.actionType)

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={{ background: meta.color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Icon} label={data.label ?? meta.label} sublabel={sublabel} color={meta.color} bg={meta.bg} border={meta.border} selected={selected} typeLabel={typeLabel}>
        {isChannel
          ? <ChannelStats stats={data.stats} />
          : data.stats?.processed > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: 8.5, color: '#4a5060' }}>İşlendi</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, fontFamily: 'JetBrains Mono, monospace' }}>{data.stats.processed.toLocaleString('tr')}</span>
            </div>
          )
        }
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="out" style={{ background: meta.color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5 }} />
    </div>
  )
})
ActionNode.displayName = 'ActionNode'

/* ── Wait Node ─────────────────────────────────────────────── */

export const WaitNode = memo(({ data, selected }: NodeProps) => {
  const color = '#fbbf24'
  const unitMap: Record<string, string> = { minutes: 'dakika', hours: 'saat', days: 'gün' }
  const sublabel = `${data.delayAmount ?? 1} ${unitMap[data.delayUnit ?? 'hours'] ?? 'saat'} sonra devam et`

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Timer} label={data.label ?? `${data.delayAmount ?? 1} ${unitMap[data.delayUnit ?? 'hours'] ?? 'saat'} Bekle`} sublabel={sublabel} color={color} bg="rgba(251,191,36,0.10)" border="rgba(251,191,36,0.25)" selected={selected} typeLabel="BEKLE">
        {data.stats?.waiting > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 8.5, color: '#4a5060' }}>Bekliyor</span>
            <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{data.stats.waiting.toLocaleString('tr')}</span>
          </div>
        )}
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="out" style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5 }} />
    </div>
  )
})
WaitNode.displayName = 'WaitNode'

/* ── Condition Node ────────────────────────────────────────── */

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const color = '#4470ff'
  const conditionLabels: Record<string, string> = {
    email_opened:    'Mail açıldı mı?',
    purchased:       'Satın aldı mı?',
    clicked:         'Link tıkladı mı?',
    is_vip:          'VIP müşteri mi?',
    order_completed: 'Sipariş Tamamlandı mı?',
    total_spent_gt:  `Harcama > ${data.config?.value ?? '0'} ₺`,
    order_count_gt:  `Sipariş > ${data.config?.value ?? '0'}`,
  }
  const condText = conditionLabels[data.condition ?? ''] ?? (data.condition || 'Koşul seçilmedi')

  return (
    <div style={{ position: 'relative' }}>
      <Handle type="target" position={Position.Top} id="in" style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={GitBranch} label={data.label ?? 'Koşul'} sublabel={condText} color={color} bg="rgba(68,112,255,0.10)" border="rgba(68,112,255,0.25)" selected={selected} typeLabel="KOŞUL">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(16,185,129,0.2)' }}>✓ EVET</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(248,113,113,0.2)' }}>✗ HAYIR</span>
        </div>
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="yes" style={{ background: '#10b981', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '28%' }} />
      <Handle type="source" position={Position.Bottom} id="no"  style={{ background: '#f87171', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '72%' }} />
    </div>
  )
})
ConditionNode.displayName = 'ConditionNode'

/* ── Stop / End Node ───────────────────────────────────────── */

export const StopNode = memo(({ data, selected }: NodeProps) => {
  const color = '#22c97a'
  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={CheckCircle} label={data.label ?? 'Otomasyon Sonlandı'} sublabel="Müşteri akışı tamamladı" color={color} bg="rgba(34,201,122,0.10)" border="rgba(34,201,122,0.25)" selected={selected} typeLabel="BİTİŞ">
        {data.stats?.completed > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: 8.5, color: '#4a5060' }}>Tamamladı</span>
            <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: 'JetBrains Mono, monospace' }}>{data.stats.completed.toLocaleString('tr')}</span>
          </div>
        )}
      </NodeCard>
    </div>
  )
})
StopNode.displayName = 'StopNode'

/* ── Split Test Node ───────────────────────────────────────── */

export const SplitTestNode = memo(({ data, selected }: NodeProps) => {
  const color = '#9f7afa'
  const aPercent = data.config?.aPercent ?? 50
  return (
    <div>
      <Handle type="target" position={Position.Top} id="in" style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Shuffle} label={data.label ?? 'A/B Testi'} sublabel={`A: %${aPercent} · B: %${100 - aPercent}`} color={color} bg="rgba(159,122,250,0.10)" border="rgba(159,122,250,0.25)" selected={selected} typeLabel="A/B TEST">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#22c97a', background: 'rgba(34,201,122,0.1)', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(34,201,122,0.2)' }}>A %{aPercent}</span>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.1)', padding: '3px 10px', borderRadius: 100, border: '1px solid rgba(96,165,250,0.2)' }}>B %{100 - aPercent}</span>
        </div>
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="a" style={{ background: '#22c97a', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '28%' }} />
      <Handle type="source" position={Position.Bottom} id="b" style={{ background: '#60a5fa', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '72%' }} />
    </div>
  )
})
SplitTestNode.displayName = 'SplitTestNode'
