'use client'

import { useEffect, useState } from 'react'
import { type Node } from 'reactflow'
import { X, Trash2, Copy, ChevronDown } from 'lucide-react'
import { getNodeMeta, type NodeStats } from './AutomationNodes'

/* ─────────────────────────────────────────────────────────────
   ATOM INPUTS
───────────────────────────────────────────────────────────── */

const inputBase: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '7px 11px', fontSize: 12, color: '#0f172a',
  background: '#faf9ff', border: '1px solid #e8e4f8',
  borderRadius: 8, outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.14s, box-shadow 0.14s',
}

function inp(el: HTMLElement) { el.style.borderColor = '#6366f1'; el.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }
function blr(el: HTMLElement) { el.style.borderColor = '#e8e4f8'; el.style.boxShadow = 'none' }

function PInput({ label, value, onChange, placeholder, type = 'text', hint }: {
  label?: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; hint?: string
}) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>}
      <input type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={e => inp(e.target)} onBlur={e => blr(e.target)}
        style={inputBase} />
      {hint && <p style={{ margin: '3px 0 0', fontSize: 9.5, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

function PTextarea({ label, value, onChange, placeholder, rows = 3, hint }: {
  label?: string; value: string; onChange: (v: string) => void
  placeholder?: string; rows?: number; hint?: string
}) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>}
      <textarea value={value} placeholder={placeholder} rows={rows}
        onChange={e => onChange(e.target.value)}
        onFocus={e => inp(e.target)} onBlur={e => blr(e.target)}
        style={{ ...inputBase, resize: 'vertical', lineHeight: 1.55 }} />
      {hint && <p style={{ margin: '3px 0 0', fontSize: 9.5, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

function PSelect({ label, value, options, onChange, hint }: {
  label?: string; value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void; hint?: string
}) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          onFocus={e => inp(e.target)} onBlur={e => blr(e.target)}
          style={{ ...inputBase, appearance: 'none', cursor: 'pointer', paddingRight: 28 }}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={11} color="#94a3b8" style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>
      {hint && <p style={{ margin: '3px 0 0', fontSize: 9.5, color: '#94a3b8' }}>{hint}</p>}
    </div>
  )
}

function PToggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 10px', borderRadius: 8, background: '#faf9ff', border: '1px solid #f1f5f9' }}>
      <div>
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 500, color: '#334155' }}>{label}</p>
        {description && <p style={{ margin: '1px 0 0', fontSize: 9.5, color: '#94a3b8' }}>{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)} style={{
        flexShrink: 0, width: 36, height: 20, borderRadius: 100, border: 'none',
        cursor: 'pointer', background: checked ? '#6366f1' : '#e2e8f0', position: 'relative', transition: 'background 0.18s',
      }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 9 }}>
        <span style={{ width: 3, height: 11, borderRadius: 2, background: 'linear-gradient(180deg,#6366f1,#7c3aed)', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 7.5, fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1.6px' }}>{title}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}

function StatBig({ label, value, color }: { label: string; value: number; color: string }) {
  const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toLocaleString('tr')
  return (
    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#faf9ff', border: '1px solid #ede9fe', textAlign: 'center' }}>
      <p style={{ margin: 0, fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 900, color: value > 0 ? color : '#e2e8f0', fontFamily: 'ui-monospace,monospace', lineHeight: 1 }}>
        {value > 0 ? fmt(value) : '—'}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TEMPLATE SELECT
───────────────────────────────────────────────────────────── */

function TemplateSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    fetch('/api/templates').then(r => r.json()).then(d => { if (Array.isArray(d)) setTemplates(d) }).catch(() => {})
  }, [])
  const opts = [
    { value: '', label: 'Şablon kullanma (manuel yaz)' },
    ...templates.map(t => ({ value: t.id, label: t.name })),
  ]
  return <PSelect label="E-posta Şablonu" value={value} options={opts} onChange={onChange} />
}

/* ─────────────────────────────────────────────────────────────
   CONFIG DATA
───────────────────────────────────────────────────────────── */

const CART_DURATIONS = [
  { value: '15', label: '15 dakika' }, { value: '30', label: '30 dakika' },
  { value: '60', label: '1 saat' },   { value: '120', label: '2 saat' },
  { value: '240', label: '4 saat' },  { value: '1440', label: '24 saat' },
]
const INACTIVE_DAYS  = [7,14,30,60,90].map(d => ({ value: String(d), label: `${d} gün` }))
const DELAY_UNITS    = [{ value:'minutes',label:'Dakika'},{value:'hours',label:'Saat'},{value:'days',label:'Gün'}]
const BIRTHDAY_WHEN  = [{ value:'-7',label:'7 gün önce'},{value:'-3',label:'3 gün önce'},{value:'0',label:'Doğum günü'},{value:'1',label:'1 gün sonra'}]
const METHODS        = ['POST','GET','PUT','PATCH'].map(m => ({ value: m, label: m }))
const COUNTRIES      = [{value:'',label:'Tümü'},{value:'TR',label:'Türkiye'},{value:'DE',label:'Almanya'},{value:'US',label:'Amerika'},{value:'UK',label:'İngiltere'}]
const SOURCES        = [{value:'',label:'Tümü'},{value:'shopify',label:'Shopify'},{value:'woocommerce',label:'WooCommerce'},{value:'manual',label:'Manuel'},{value:'import',label:'CSV İçe Aktarma'}]
const CATEGORIES     = [{value:'',label:'Tümü'},{value:'clothing',label:'Giyim'},{value:'electronics',label:'Elektronik'},{value:'food',label:'Gıda'},{value:'beauty',label:'Kozmetik'}]
const NO_PURCHASE_DAYS = [7,14,30,60,90,180].map(d => ({ value: String(d), label: `${d} gündür satın almadı` }))

const CONDITIONS_OPT = [
  { value:'',                label:'Koşul seç…' },
  { value:'email_opened',    label:'Mail açıldı mı?' },
  { value:'purchased',       label:'Satın aldı mı?' },
  { value:'clicked',         label:'Link tıkladı mı?' },
  { value:'is_vip',          label:'VIP müşteri mi?' },
  { value:'order_completed', label:'Sipariş tamamlandı mı?' },
  { value:'no_purchase',     label:'Satın almadı (son N gün)' },
  { value:'total_spent_gt',  label:'Toplam harcama >' },
  { value:'order_count_gt',  label:'Sipariş sayısı >' },
]

type Cfg = Record<string, string | boolean | undefined>

/* ─────────────────────────────────────────────────────────────
   TRIGGER CONFIG
───────────────────────────────────────────────────────────── */

function TriggerConfig({ node, upd }: { node: Node; upd: (p: Cfg) => void }) {
  const tt  = node.data.triggerType as string
  const cfg = (node.data.config ?? {}) as Cfg
  const s   = (k: string) => String(cfg[k] ?? '')
  const b   = (k: string) => !!cfg[k]
  const set = (k: string, v: string | boolean) => upd({ [k]: v })

  if (tt === 'cart_abandoned') return (
    <Section title="Tetikleyici Ayarları">
      <PSelect label="Sepet Terk Süresi" value={s('abandonDuration') || '30'} options={CART_DURATIONS} onChange={v => set('abandonDuration', v)} />
      <PInput label="Min. Sepet Tutarı (₺)" value={s('minCartAmount')} placeholder="0" type="number" onChange={v => set('minCartAmount', v)} />
      <PToggle label="Kupon Kullananları Dahil Et" checked={b('includeCoupon')} onChange={v => set('includeCoupon', v)} />
      <PToggle label="Daha Önce Sipariş Verenleri Dahil Et" checked={b('includePrevOrders')} onChange={v => set('includePrevOrders', v)} />
    </Section>
  )

  if (tt === 'new_customer') return (
    <Section title="Tetikleyici Ayarları">
      <PSelect label="Müşteri Kaynağı" value={s('source')} options={SOURCES} onChange={v => set('source', v)} />
      <PToggle label="Sadece Onaylı E-postalar" checked={b('verifiedOnly')} onChange={v => set('verifiedOnly', v)} />
    </Section>
  )

  if (tt === 'order_created') return (
    <Section title="Tetikleyici Ayarları">
      <PInput label="Min. Sipariş Tutarı (₺)" value={s('minOrderAmount')} placeholder="0" type="number" onChange={v => set('minOrderAmount', v)} />
      <PSelect label="Ürün Kategorisi" value={s('category')} options={CATEGORIES} onChange={v => set('category', v)} />
      <PSelect label="Ülke" value={s('country')} options={COUNTRIES} onChange={v => set('country', v)} />
      <PToggle label="Sadece İlk Siparişler" checked={b('firstOrderOnly')} onChange={v => set('firstOrderOnly', v)} />
    </Section>
  )

  if (tt === 'checkout_started') return (
    <Section title="Tetikleyici Ayarları">
      <PInput label="Min. Sepet Tutarı (₺)" value={s('minCartAmount')} placeholder="0" type="number" onChange={v => set('minCartAmount', v)} />
      <PToggle label="Sadece Kayıtlı Kullanıcılar" checked={b('registeredOnly')} onChange={v => set('registeredOnly', v)} />
    </Section>
  )

  if (tt === 'product_viewed') return (
    <Section title="Tetikleyici Ayarları">
      <PInput label="Ürün ID (opsiyonel)" value={s('productId')} placeholder="Tüm ürünler" onChange={v => set('productId', v)} />
      <PSelect label="Kategori" value={s('category')} options={CATEGORIES} onChange={v => set('category', v)} />
      <PInput label="Min. Görüntülenme Sayısı" value={s('minViews') || '1'} type="number" onChange={v => set('minViews', v)} />
    </Section>
  )

  if (tt === 'tag_added') return (
    <Section title="Tetikleyici Ayarları">
      <PInput label="Etiket Adı" value={s('tagName')} placeholder="vip, aktif…" hint="Bu etiket eklendiğinde tetiklenir" onChange={v => set('tagName', v)} />
    </Section>
  )

  if (tt === 'customer_inactive') return (
    <Section title="Tetikleyici Ayarları">
      <PSelect label="Pasiflik Süresi" value={s('inactiveDays') || '30'} options={INACTIVE_DAYS} onChange={v => set('inactiveDays', v)} />
      <PToggle label="Sadece Daha Önce Sipariş Verenler" checked={b('hadOrderBefore')} onChange={v => set('hadOrderBefore', v)} />
    </Section>
  )

  if (tt === 'birthday') return (
    <Section title="Tetikleyici Ayarları">
      <PSelect label="Gönderim Zamanı" value={s('birthdayOffset') || '0'} options={BIRTHDAY_WHEN} onChange={v => set('birthdayOffset', v)} />
      <PInput label="Gönderim Saati" value={s('sendTime') || '10:00'} type="time" onChange={v => set('sendTime', v)} />
      <PToggle label="Otomatik Kupon Ekle" checked={b('addCoupon')} onChange={v => set('addCoupon', v)} />
    </Section>
  )

  if (tt === 'manual_trigger') return (
    <Section title="Tetikleyici Ayarları">
      <PTextarea label="Açıklama (opsiyonel)" value={s('description')} placeholder="Bu akış ne zaman tetiklenmeli?" rows={2} onChange={v => set('description', v)} />
      <PInput label="Hedef Segment (opsiyonel)" value={s('targetSegment')} placeholder="Tüm müşteriler" onChange={v => set('targetSegment', v)} />
    </Section>
  )

  if (tt === 'custom_event') return (
    <Section title="Tetikleyici Ayarları">
      <PInput label="Event Adı" value={s('eventName')} placeholder="purchase_completed" hint="API'den gönderilen event adı" onChange={v => set('eventName', v)} />
      <PInput label="Event Property Filtresi (opsiyonel)" value={s('propertyFilter')} placeholder={'{"plan":"premium"}'} onChange={v => set('propertyFilter', v)} />
    </Section>
  )

  return null
}

/* ─────────────────────────────────────────────────────────────
   ACTION CONFIG
───────────────────────────────────────────────────────────── */

function ActionConfig({ node, upd }: { node: Node; upd: (p: Cfg) => void }) {
  const at  = node.data.actionType as string
  const cfg = (node.data.config ?? {}) as Cfg
  const s   = (k: string) => String(cfg[k] ?? '')
  const b   = (k: string) => !!cfg[k]
  const set = (k: string, v: string | boolean) => upd({ [k]: v })

  if (at === 'send_email') return (
    <>
      <Section title="Şablon">
        <TemplateSelect value={s('templateId')} onChange={v => set('templateId', v)} />
      </Section>
      {!cfg.templateId && (
        <Section title="Manuel İçerik">
          <PInput label="Konu Başlığı" value={s('subject')} placeholder="Hoş geldiniz {{firstName}}!" hint="{{firstName}}, {{email}} değişkenleri kullanılabilir" onChange={v => set('subject', v)} />
          <PInput label="Preview Metni" value={s('previewText')} placeholder="E-posta önizleme metni…" onChange={v => set('previewText', v)} />
          <PTextarea label="İçerik" value={s('body')} placeholder={'Merhaba {{firstName}},\n\nE-posta içeriği…'} rows={4} onChange={v => set('body', v)} />
        </Section>
      )}
      <Section title="Gönderici">
        <PInput label="Gönderici Adı" value={s('senderName')} placeholder="Mağaza Adınız" onChange={v => set('senderName', v)} />
      </Section>
    </>
  )

  if (at === 'send_whatsapp') return (
    <Section title="WhatsApp Ayarları">
      <PTextarea label="Mesaj" value={s('message')} placeholder={'Merhaba {{firstName}},\n\nMesaj içeriği…'} rows={4} hint="{{firstName}}, {{email}}, {{phone}} kullanılabilir" onChange={v => set('message', v)} />
      <PToggle label="Medya / Görsel Ekle" checked={b('includeMedia')} onChange={v => set('includeMedia', v)} />
    </Section>
  )

  if (at === 'add_tag' || at === 'remove_tag') return (
    <Section title="Etiket Ayarları">
      <PInput label="Etiket Adı" value={s('tag')} placeholder="vip, kayip, hosgeldin…" hint="Küçük harf, boşluksuz önerilir" onChange={v => set('tag', v)} />
    </Section>
  )

  if (at === 'move_segment') return (
    <Section title="Segment Ayarları">
      <PInput label="Segment Adı" value={s('segment')} placeholder="Segment adı" onChange={v => set('segment', v)} />
      <PSelect label="İşlem" value={s('segmentAction') || 'add'}
        options={[{ value: 'add', label: 'Segmente Ekle' }, { value: 'remove', label: 'Segmentten Çıkar' }]}
        onChange={v => set('segmentAction', v)} />
    </Section>
  )

  if (at === 'webhook') return (
    <Section title="Webhook Ayarları">
      <PInput label="URL" value={s('url')} placeholder="https://api.example.com/hook" onChange={v => set('url', v)} />
      <PSelect label="HTTP Yöntemi" value={s('method') || 'POST'} options={METHODS} onChange={v => set('method', v)} />
      <PTextarea label="Headers (JSON)" value={s('headers')} placeholder={'{"Authorization":"Bearer token"}'} rows={2} onChange={v => set('headers', v)} />
      <PTextarea label="Body (JSON)" value={s('body')} placeholder={'{"customerId":"{{customerId}}"}'} rows={3} hint="{{customerId}}, {{firstName}}, {{email}} kullanılabilir" onChange={v => set('body', v)} />
    </Section>
  )

  return null
}

/* ─────────────────────────────────────────────────────────────
   MAIN PANEL
───────────────────────────────────────────────────────────── */

interface Props {
  node:     Node
  onUpdate: (id: string, patch: Record<string, unknown>) => void
  onDelete: (id: string) => void
  onCopy:   (node: Node) => void
  onClose:  () => void
}

export default function PropertiesPanel({ node, onUpdate, onDelete, onCopy, onClose }: Props) {
  const meta      = getNodeMeta(node.data.triggerType ?? node.data.actionType ?? node.data.type ?? '')
  const Icon      = meta.icon
  const stats     = (node.data.stats ?? {}) as NodeStats
  const cfg       = (node.data.config ?? {}) as Cfg

  const isTrigger   = node.type === 'triggerNode'
  const isAction    = node.type === 'actionNode'
  const isWait      = node.type === 'waitNode'
  const isCondition = node.type === 'conditionNode'
  const isSplit     = node.type === 'splitTestNode'
  const isStop      = node.type === 'stopNode'

  const upd    = (patch: Record<string, unknown>) => onUpdate(node.id, patch)
  const updCfg = (patch: Cfg) => upd({ config: { ...cfg, ...patch } })

  const s = stats.sent     ?? 0
  const o = stats.opened   ?? 0
  const c = stats.clicked  ?? 0
  const entered   = stats.entered   ?? 0
  const completed = stats.completed ?? 0

  return (
    <aside style={{
      width: 288, background: '#ffffff',
      borderLeft: '1px solid rgba(99,102,241,0.1)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '-2px 0 10px rgba(99,102,241,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px 12px', borderBottom: '1px solid rgba(99,102,241,0.08)', background: '#ffffff', position: 'sticky', top: 0, zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 3, height: 14, borderRadius: 2, background: 'linear-gradient(180deg,#6366f1,#7c3aed)' }} />
          <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>Adım Özellikleri</p>
        </div>
        <button onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #ede9fe', background: '#faf9ff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', transition: 'all 0.13s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.color = '#6366f1' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#faf9ff'; e.currentTarget.style.color = '#a5b4fc' }}>
          <X size={12} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Node identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 11, background: meta.bgColor, border: `1px solid ${meta.color}18` }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: `1px solid ${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={14} color={meta.color} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#111827' }}>{meta.label}</p>
            <p style={{ margin: 0, fontSize: 9.5, color: `${meta.color}cc` }}>{meta.sublabel}</p>
          </div>
        </div>

        {/* Step name */}
        <Section title="Adım Adı">
          <PInput value={String(node.data.title ?? '')} placeholder="Adım adını girin…" onChange={v => upd({ title: v })} />
        </Section>

        {/* Trigger-specific */}
        {isTrigger && <TriggerConfig node={node} upd={updCfg} />}

        {/* Trigger global filters */}
        {isTrigger && (
          <Section title="Filtreler">
            <PSelect label="Ülke Filtresi" value={String(cfg.country ?? '')} options={COUNTRIES} onChange={v => updCfg({ country: v })} />
            <PSelect label="Kategori Filtresi" value={String(cfg.categoryFilter ?? '')} options={CATEGORIES} onChange={v => updCfg({ categoryFilter: v })} />
            <PInput label="Segment Filtresi (opsiyonel)" value={String(cfg.filterSegment ?? '')} placeholder="Tüm müşteriler" onChange={v => updCfg({ filterSegment: v })} />
          </Section>
        )}

        {/* Action-specific */}
        {isAction && <ActionConfig node={node} upd={updCfg} />}

        {/* Wait */}
        {isWait && (
          <Section title="Bekleme Süresi">
            <div style={{ display: 'flex', gap: 8 }}>
              <PInput value={String(node.data.delayAmount ?? 1)} type="number" placeholder="1" onChange={v => upd({ delayAmount: Math.max(1, parseInt(v) || 1) })} />
              <PSelect value={String(node.data.delayUnit ?? 'hours')} options={DELAY_UNITS} onChange={v => upd({ delayUnit: v })} />
            </div>
          </Section>
        )}

        {/* Condition */}
        {isCondition && (
          <Section title="Koşul Ayarları">
            <PSelect label="Koşul Tipi" value={String(node.data.condition ?? '')} options={CONDITIONS_OPT} onChange={v => upd({ condition: v })} />
            {(node.data.condition === 'total_spent_gt' || node.data.condition === 'order_count_gt') && (
              <PInput label="Eşik Değeri" value={String(cfg.value ?? '')} type="number" placeholder="0" onChange={v => updCfg({ value: v })} />
            )}
            {node.data.condition === 'no_purchase' && (
              <PSelect label="Süre" value={String(cfg.days ?? '30')} options={NO_PURCHASE_DAYS} onChange={v => updCfg({ days: v })} />
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, padding: '7px 10px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: '#15803d' }}>✓ EVET</p>
                <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#4ade80' }}>Sol çıkış</p>
              </div>
              <div style={{ flex: 1, padding: '7px 10px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fca5a5', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 9.5, fontWeight: 700, color: '#b91c1c' }}>✗ HAYIR</p>
                <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#f87171' }}>Sağ çıkış</p>
              </div>
            </div>
          </Section>
        )}

        {/* A/B Split */}
        {isSplit && (
          <Section title="A/B Bölüm Oranı">
            <PInput label="A Grubu Adı" value={String(cfg.aLabel ?? 'Varyant A')} onChange={v => updCfg({ aLabel: v })} />
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, color: '#475569', fontWeight: 600 }}>A Oranı</span>
                <span style={{ fontSize: 12.5, fontWeight: 800, color: '#6366f1', fontFamily: 'ui-monospace,monospace' }}>%{cfg.aPercent ?? 50}</span>
              </div>
              <input type="range" min={10} max={90} value={Number(cfg.aPercent ?? 50)}
                onChange={e => updCfg({ aPercent: parseInt(e.target.value) as unknown as string })}
                style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9.5, color: '#9ca3af' }}>
                <span>A: %{cfg.aPercent ?? 50}</span>
                <span>B: %{100 - Number(cfg.aPercent ?? 50)}</span>
              </div>
            </div>
          </Section>
        )}

        {/* Stop */}
        {isStop && (
          <Section title="Bitiş">
            <PTextarea label="Açıklama (opsiyonel)" value={String(cfg.description ?? '')} placeholder="Bu akış neden bitiyor?" rows={2} onChange={v => updCfg({ description: v })} />
          </Section>
        )}

        {/* Statistics */}
        {isAction && ['send_email','send_whatsapp'].includes(node.data.actionType) && s > 0 && (
          <Section title="İstatistikler">
            <div style={{ display: 'flex', gap: 8 }}>
              <StatBig label="Gönderildi" value={s} color="#475569" />
              <StatBig label="Açıldı" value={o} color="#16a34a" />
              <StatBig label="Tıklandı" value={c} color="#4f46e5" />
            </div>
          </Section>
        )}

        {isTrigger && entered > 0 && (
          <Section title="İstatistikler">
            <div style={{ display: 'flex', gap: 8 }}>
              <StatBig label="Tetiklenen" value={entered} color="#6366f1" />
              <StatBig label="Tamamlanan" value={completed} color="#16a34a" />
            </div>
            {entered > 0 && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac' }}>
                <p style={{ margin: 0, fontSize: 9.5, color: '#15803d', fontWeight: 600 }}>Dönüşüm Oranı</p>
                <p style={{ margin: '4px 0 0', fontSize: 26, fontWeight: 900, color: '#16a34a', fontFamily: 'ui-monospace,monospace', lineHeight: 1 }}>
                  %{((completed / entered) * 100).toFixed(1)}
                </p>
              </div>
            )}
          </Section>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '11px 14px', borderTop: '1px solid rgba(99,102,241,0.08)', display: 'flex', gap: 7 }}>
        <button onClick={() => onCopy(node)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: '1px solid #ede9fe', background: '#faf9ff', color: '#6366f1', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, transition: 'all 0.13s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0eeff'; e.currentTarget.style.borderColor = '#c4b5fd' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#faf9ff'; e.currentTarget.style.borderColor = '#ede9fe' }}>
          <Copy size={12} /> Kopyala
        </button>
        <button onClick={() => onDelete(node.id)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '8px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff5f5', color: '#dc2626', cursor: 'pointer', fontSize: 11.5, fontWeight: 600, transition: 'all 0.13s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#fca5a5' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff5f5'; e.currentTarget.style.borderColor = '#fecaca' }}>
          <Trash2 size={12} /> Adımı Sil
        </button>
      </div>
    </aside>
  )
}
