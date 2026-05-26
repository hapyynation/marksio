'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import {
  ShoppingCart, UserPlus, Package, Eye, CreditCard, Clock,
  Gift, Play, Mail, MessageCircle, Timer, GitBranch, Shuffle,
  Tag, Tags, Layers, Square, Zap, Activity, TrendingUp,
} from 'lucide-react'

/* ── Trigger types ─────────────────────────────────────────── */

export const TRIGGER_TYPES = [
  { type: 'cart_abandoned',     label: 'Sepet Terk',          icon: ShoppingCart, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  { type: 'new_customer',       label: 'Yeni Müşteri',        icon: UserPlus,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
  { type: 'order_created',      label: 'Sipariş Oluşturuldu', icon: Package,      color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  { type: 'product_viewed',     label: 'Ürün Görüntülendi',   icon: Eye,          color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)' },
  { type: 'checkout_started',   label: 'Ödeme Başlatıldı',    icon: CreditCard,   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  { type: 'customer_inactive',  label: 'Müşteri Pasif',       icon: Clock,        color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  { type: 'birthday',           label: 'Doğum Günü',          icon: Gift,         color: '#ec4899', bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.3)' },
  { type: 'manual_trigger',     label: 'Manuel Tetikle',      icon: Play,         color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',border: 'rgba(167,139,250,0.3)' },
]

/* ── Action types ──────────────────────────────────────────── */

export const ACTION_TYPES = [
  { type: 'send_email',    label: 'E-posta Gönder',  icon: Mail,          color: '#b4c5ff', bg: 'rgba(180,197,255,0.10)', border: 'rgba(180,197,255,0.25)' },
  { type: 'send_whatsapp', label: 'WhatsApp Gönder', icon: MessageCircle, color: '#25d366', bg: 'rgba(37,211,102,0.10)',  border: 'rgba(37,211,102,0.25)' },
  { type: 'add_tag',       label: 'Etiket Ekle',     icon: Tag,           color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' },
  { type: 'remove_tag',    label: 'Etiket Kaldır',   icon: Tags,          color: '#f87171', bg: 'rgba(248,113,113,0.10)',border: 'rgba(248,113,113,0.25)' },
  { type: 'move_segment',  label: 'Segment Değiştir',icon: Layers,        color: '#a78bfa', bg: 'rgba(167,139,250,0.10)',border: 'rgba(167,139,250,0.25)' },
]

export const LOGIC_TYPES = [
  { type: 'wait',       label: 'Bekle',    icon: Timer,       color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  border: 'rgba(251,191,36,0.25)' },
  { type: 'condition',  label: 'Koşul',    icon: GitBranch,   color: '#fb923c', bg: 'rgba(251,146,60,0.10)',  border: 'rgba(251,146,60,0.25)' },
  { type: 'split_test', label: 'Split A/B',icon: Shuffle,     color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.25)' },
  { type: 'stop',       label: 'Bitir',    icon: Square,      color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)' },
]

export function getNodeMeta(type: string) {
  return (
    TRIGGER_TYPES.find(t => t.type === type) ||
    ACTION_TYPES.find(t => t.type === type) ||
    LOGIC_TYPES.find(t => t.type === type) ||
    { type, label: type, icon: Zap, color: '#8b95a8', bg: 'rgba(139,149,168,0.10)', border: 'rgba(139,149,168,0.25)' }
  )
}

/* ── Shared node card ──────────────────────────────────────── */

function NodeCard({
  icon: Icon, label, sublabel, color, bg, border, selected,
  children,
}: {
  icon: React.ElementType; label: string; sublabel?: string
  color: string; bg: string; border: string; selected?: boolean
  children?: React.ReactNode
}) {
  return (
    <div style={{
      background: selected ? 'rgba(22,24,36,0.98)' : 'rgba(16,18,28,0.96)',
      border: `1.5px solid ${selected ? color : border}`,
      borderRadius: 14,
      padding: '12px 14px',
      minWidth: 180,
      maxWidth: 220,
      cursor: 'grab',
      backdropFilter: 'blur(12px)',
      boxShadow: selected
        ? `0 0 0 3px ${color}22, 0 8px 24px rgba(0,0,0,0.4)`
        : '0 4px 16px rgba(0,0,0,0.3)',
      transition: 'box-shadow 0.15s, border-color 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: bg, border: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={16} color={color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#e2e8f8', lineHeight: 1.3 }}>{label}</p>
          {sublabel && <p style={{ margin: 0, fontSize: 10, color: '#8b95a8', lineHeight: 1.3, marginTop: 2 }}>{sublabel}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 10, color: '#8b95a8' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value.toLocaleString('tr')}</span>
    </div>
  )
}

/* ── Trigger Node ──────────────────────────────────────────── */

export const TriggerNode = memo(({ data, selected }: NodeProps) => {
  const meta = getNodeMeta(data.triggerType)
  const Icon = meta.icon
  const sublabel = data.config?.segment ? `Segment: ${data.config.segment}` : undefined

  return (
    <div>
      <div style={{
        fontSize: 9, fontWeight: 700, color: meta.color, textTransform: 'uppercase',
        letterSpacing: '1.5px', textAlign: 'center', marginBottom: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <Zap size={9} color={meta.color} />
        TETİKLEYİCİ
      </div>
      <NodeCard icon={Icon} label={data.label ?? meta.label} sublabel={sublabel} color={meta.color} bg={meta.bg} border={meta.border} selected={selected}>
        <StatBadge label="Girdi" value={data.stats?.entered ?? 0} color={meta.color} />
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="out"
        style={{ background: meta.color, border: `2px solid rgba(0,0,0,0.5)`, width: 10, height: 10, bottom: -5 }} />
    </div>
  )
})
TriggerNode.displayName = 'TriggerNode'

/* ── Action Node ───────────────────────────────────────────── */

export const ActionNode = memo(({ data, selected }: NodeProps) => {
  const meta = getNodeMeta(data.actionType)
  const Icon = meta.icon
  let sublabel = ''
  if (data.actionType === 'send_email' && data.config?.subject) sublabel = data.config.subject.slice(0, 28)
  if (data.actionType === 'send_whatsapp' && data.config?.message) sublabel = data.config.message.slice(0, 28)
  if (data.actionType === 'add_tag' && data.config?.tag) sublabel = `#${data.config.tag}`
  if (data.actionType === 'move_segment' && data.config?.segment) sublabel = `→ ${data.config.segment}`

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in"
        style={{ background: meta.color, border: `2px solid rgba(0,0,0,0.5)`, width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Icon} label={data.label ?? meta.label} sublabel={sublabel || undefined} color={meta.color} bg={meta.bg} border={meta.border} selected={selected}>
        <StatBadge label="İşlendi" value={data.stats?.processed ?? 0} color={meta.color} />
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="out"
        style={{ background: meta.color, border: `2px solid rgba(0,0,0,0.5)`, width: 10, height: 10, bottom: -5 }} />
    </div>
  )
})
ActionNode.displayName = 'ActionNode'

/* ── Wait Node ─────────────────────────────────────────────── */

export const WaitNode = memo(({ data, selected }: NodeProps) => {
  const color = '#fbbf24'
  const unitMap: Record<string, string> = { minutes: 'dakika', hours: 'saat', days: 'gün' }
  const sublabel = `${data.delayAmount ?? 1} ${unitMap[data.delayUnit ?? 'hours'] ?? 'saat'} bekle`

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in"
        style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Timer} label="Bekle" sublabel={sublabel} color={color}
        bg="rgba(251,191,36,0.10)" border="rgba(251,191,36,0.25)" selected={selected}>
        <StatBadge label="Bekliyor" value={data.stats?.waiting ?? 0} color={color} />
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="out"
        style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5 }} />
    </div>
  )
})
WaitNode.displayName = 'WaitNode'

/* ── Condition Node ────────────────────────────────────────── */

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const color = '#fb923c'
  const conditionLabels: Record<string, string> = {
    email_opened: 'Mail açıldı mı?',
    purchased: 'Satın aldı mı?',
    clicked: 'Link tıkladı mı?',
    is_vip: 'VIP müşteri mi?',
    total_spent_gt: `Harcama > ${data.config?.value ?? '0'} ₺`,
    order_count_gt: `Sipariş > ${data.config?.value ?? '0'}`,
  }
  const sublabel = conditionLabels[data.condition ?? ''] ?? (data.condition ?? 'Koşul seç')

  return (
    <div>
      <Handle type="target" position={Position.Top} id="in"
        style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={GitBranch} label="Koşul" sublabel={sublabel} color={color}
        bg="rgba(251,146,60,0.10)" border="rgba(251,146,60,0.25)" selected={selected}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>✓ Evet</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#f87171', background: 'rgba(248,113,113,0.12)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(248,113,113,0.2)' }}>✗ Hayır</span>
        </div>
      </NodeCard>
      {/* Yes branch - left */}
      <Handle type="source" position={Position.Bottom} id="yes"
        style={{ background: '#10b981', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '30%' }} />
      {/* No branch - right */}
      <Handle type="source" position={Position.Bottom} id="no"
        style={{ background: '#f87171', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '70%' }} />
    </div>
  )
})
ConditionNode.displayName = 'ConditionNode'

/* ── Stop Node ─────────────────────────────────────────────── */

export const StopNode = memo(({ data, selected }: NodeProps) => {
  const color = '#f87171'
  return (
    <div>
      <Handle type="target" position={Position.Top} id="in"
        style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Square} label="Akışı Bitir" sublabel={data.label ?? 'Flow sona eriyor'}
        color={color} bg="rgba(248,113,113,0.10)" border="rgba(248,113,113,0.25)" selected={selected}>
        <StatBadge label="Tamamladı" value={data.stats?.completed ?? 0} color={color} />
      </NodeCard>
    </div>
  )
})
StopNode.displayName = 'StopNode'

/* ── Split Test Node ───────────────────────────────────────── */

export const SplitTestNode = memo(({ data, selected }: NodeProps) => {
  const color = '#34d399'
  const aPercent = data.config?.aPercent ?? 50
  const sublabel = `A: %${aPercent} · B: %${100 - aPercent}`
  return (
    <div>
      <Handle type="target" position={Position.Top} id="in"
        style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, top: -5 }} />
      <NodeCard icon={Shuffle} label="A/B Testi" sublabel={sublabel}
        color={color} bg="rgba(52,211,153,0.10)" border="rgba(52,211,153,0.25)" selected={selected}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color, background: 'rgba(52,211,153,0.12)', padding: '2px 8px', borderRadius: 6, border: `1px solid rgba(52,211,153,0.2)` }}>A Grubu</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(96,165,250,0.2)' }}>B Grubu</span>
        </div>
      </NodeCard>
      <Handle type="source" position={Position.Bottom} id="a"
        style={{ background: color, border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="b"
        style={{ background: '#60a5fa', border: '2px solid rgba(0,0,0,0.5)', width: 10, height: 10, bottom: -5, left: '70%' }} />
    </div>
  )
})
SplitTestNode.displayName = 'SplitTestNode'
