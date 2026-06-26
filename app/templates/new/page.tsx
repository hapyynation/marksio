'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  ArrowLeft, Save, Eye, Plus, ChevronUp, ChevronDown, X,
  AlignLeft, Image as ImageIcon, Link as LinkIcon, Gift,
  ShoppingBag, CheckSquare, Minus, Star, Timer, LayoutGrid,
  Shield, Type, Loader2, Code, CreditCard, Mail,
} from 'lucide-react'
import type { Block } from '@/lib/email-html-renderer'
import { renderBlocksToEmailHtml } from '@/lib/email-html-renderer'

// ─── Palette config ───────────────────────────────────────────────────────────

type BlockType = Block['type']

const PALETTE = [
  {
    group: 'Temel',
    items: [
      { type: 'hero' as BlockType,    label: 'Hero Banner',    icon: ImageIcon,   color: '#4470ff' },
      { type: 'text' as BlockType,    label: 'Metin Bloğu',    icon: AlignLeft,   color: '#22c97a' },
      { type: 'image' as BlockType,   label: 'Görsel',         icon: ImageIcon,   color: '#9f7afa' },
      { type: 'cta' as BlockType,     label: 'Buton (CTA)',    icon: LinkIcon,    color: '#4470ff' },
      { type: 'divider' as BlockType, label: 'Ayraç',          icon: Minus,       color: '#8080a0' },
    ],
  },
  {
    group: 'E-ticaret',
    items: [
      { type: 'product' as BlockType,          label: 'Ürün Kartı',     icon: ShoppingBag, color: '#22c97a' },
      { type: 'coupon' as BlockType,           label: 'İndirim Kuponu', icon: Gift,        color: '#f0a020' },
      { type: 'benefits' as BlockType,         label: 'Faydalar',       icon: CheckSquare, color: '#22c97a' },
      { type: 'countdown' as BlockType,        label: 'Geri Sayım',     icon: Timer,       color: '#e84545' },
      { type: 'discount_section' as BlockType, label: 'İndirim Alanı',  icon: CreditCard,  color: '#4470ff' },
    ],
  },
  {
    group: 'Sosyal Kanıt',
    items: [
      { type: 'testimonial' as BlockType,   label: 'Referans',          icon: Star,       color: '#f0a020' },
      { type: 'feature_cards' as BlockType, label: 'Özellik Kartları',  icon: LayoutGrid, color: '#9f7afa' },
      { type: 'trust_bar' as BlockType,     label: 'Güven Çubuğu',      icon: Shield,     color: '#22c97a' },
    ],
  },
  {
    group: 'Yapı',
    items: [
      { type: 'footer' as BlockType, label: 'Alt Bilgi', icon: Type, color: '#8080a0' },
    ],
  },
]

const PALETTE_FLAT = PALETTE.flatMap(g => g.items)

const DEFAULTS: Record<string, Record<string, string>> = {
  hero:             { headline: 'Kampanya Başlığı', sub: 'Alt başlık metniniz buraya', badge: 'YENİ', bgColor: '#0a1628' },
  text:             { body: 'Merhaba {{isim}},\n\nBuraya e-posta içeriğinizi yazın.' },
  image:            { src: '', alt: 'Görsel açıklaması' },
  cta:              { label: 'Hemen İncele →', url: 'https://', color: '#3b82f6', sub: 'Ücretsiz kargo · Güvenli ödeme' },
  product:          { name: 'Ürün Adı', desc: 'Kısa ürün açıklaması', price: '₺299', oldPrice: '₺399' },
  coupon:           { code: 'INDIRIM20', discount: '%20 İndirim', expiry: '48 saat geçerli' },
  benefits:         { items: 'Ücretsiz kargo\nKolay iade\nGüvenli SSL ödeme' },
  divider:          {},
  footer:           { brand: 'Mağazanız', addr: 'İstanbul, Türkiye', unsub: 'Abonelikten çık' },
  testimonial:      { quote: 'Harika bir ürün ve müşteri hizmetleri!', name: 'Müşteri Adı', role: 'Doğrulanmış Alıcı', stars: '5' },
  countdown:        { days: '03', hours: '12', minutes: '45', seconds: '00', label: 'Kampanya bitiyor!' },
  feature_cards:    { card1_icon: '🚀', card1_title: 'Hızlı Teslimat', card1_desc: '1-2 iş gününde kapınızda', card2_icon: '🔒', card2_title: 'Güvenli Ödeme', card2_desc: '256-bit SSL şifreleme', card3_icon: '↩️', card3_title: 'Kolay İade', card3_desc: '30 gün içinde ücretsiz iade' },
  trust_bar:        { item1_icon: '🚚', item1_text: 'Ücretsiz Kargo', item2_icon: '🔒', item2_text: 'Güvenli Ödeme', item3_icon: '↩️', item3_text: 'Kolay İade', item4_icon: '⭐', item4_text: 'Müşteri Memnuniyeti' },
  discount_section: { label: 'ÖZEL TEKLİF', discountText: '%30', sub: 'Sınırlı süre — bugün sipariş verin', bgColor: '#1d4ed8' },
}

let _ctr = 200
function makeBlock(type: BlockType): Block {
  return { id: `b${_ctr++}`, type, c: { ...(DEFAULTS[type] ?? {}) } }
}

// ─── Field component (outside PropertiesPanel to avoid remount on keystroke) ──

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  colorPicker?: boolean
  placeholder?: string
}

function Field({ label, value, onChange, multiline, colorPicker, placeholder }: FieldProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
    color: '#eeeef4', fontSize: '12px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  return (
    <div>
      <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#8080a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
        {label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={4} placeholder={placeholder}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
      ) : colorPicker ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
            style={{ width: '36px', height: '32px', padding: '2px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', cursor: 'pointer', flexShrink: 0 }} />
          <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="#000000"
            style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
        </div>
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={inputStyle} />
      )}
    </div>
  )
}

// ─── Canvas block visuals ─────────────────────────────────────────────────────

function BlockVisual({ block }: { block: Block }) {
  const c = block.c
  switch (block.type) {
    case 'hero':
      return (
        <div style={{ background: c.bgColor || '#0a1628', padding: '40px 32px', textAlign: 'center' }}>
          {c.badge && (
            <div style={{ display: 'inline-block', marginBottom: '12px', padding: '4px 12px', borderRadius: '100px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase' }}>{c.badge}</div>
          )}
          <h2 style={{ margin: '0 0 10px', fontSize: '26px', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{c.headline || 'Başlık'}</h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{c.sub || 'Alt başlık'}</p>
        </div>
      )
    case 'text':
      return (
        <div style={{ padding: '24px 32px', background: '#fff' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{c.body || 'Metin içeriği...'}</p>
        </div>
      )
    case 'image':
      return (
        <div style={{ padding: '12px 28px', background: '#fff' }}>
          {c.src ? (
            <img src={c.src} alt={c.alt || ''} style={{ width: '100%', borderRadius: '12px', display: 'block' }} />
          ) : (
            <div style={{ height: '120px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e5e7eb' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🖼️</div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>Görsel URL ekleyin</p>
              </div>
            </div>
          )}
        </div>
      )
    case 'cta':
      return (
        <div style={{ padding: '24px 32px', textAlign: 'center', background: '#fff' }}>
          <div style={{ display: 'inline-block', padding: '14px 36px', background: c.color || '#3b82f6', color: '#fff', fontSize: '14px', fontWeight: 700, borderRadius: '10px' }}>
            {c.label || 'Hemen İncele'}
          </div>
          {c.sub && <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#9ca3af' }}>{c.sub}</p>}
        </div>
      )
    case 'product':
      return (
        <div style={{ padding: '12px 28px', background: '#fff' }}>
          <div style={{ display: 'flex', gap: '16px', border: '1px solid #f0f0f0', borderRadius: '14px', padding: '16px' }}>
            <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '10px', flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#111827' }}>{c.name || 'Ürün Adı'}</p>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#6b7280' }}>{c.desc || 'Açıklama'}</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#2563eb' }}>{c.price || '₺299'}</span>
                {c.oldPrice && <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>{c.oldPrice}</span>}
              </div>
            </div>
          </div>
        </div>
      )
    case 'coupon':
      return (
        <div style={{ padding: '12px 28px', background: '#fff' }}>
          <div style={{ border: '2px dashed #3b82f6', borderRadius: '14px', background: '#eff6ff', padding: '28px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px' }}>İndirim Kodu</p>
            <p style={{ margin: '0 0 6px', fontSize: '28px', fontWeight: 900, color: '#111827', letterSpacing: '6px', fontFamily: 'monospace' }}>{c.code || 'KOD20'}</p>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#2563eb' }}>{c.discount || '%20 İndirim'}</p>
            {c.expiry && <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{c.expiry}</p>}
          </div>
        </div>
      )
    case 'benefits':
      return (
        <div style={{ padding: '16px 32px', background: '#fff' }}>
          {(c.items || '').split('\n').filter(Boolean).map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'flex-start' }}>
              <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
              <span style={{ fontSize: '13px', color: '#374151' }}>{item.replace(/^[✓✗·\-*]\s?/, '')}</span>
            </div>
          ))}
          {!c.items && <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>Madde ekleyin...</p>}
        </div>
      )
    case 'divider':
      return (
        <div style={{ padding: '8px 32px', background: '#fff' }}>
          <div style={{ height: '1px', background: '#f0f0f0' }} />
        </div>
      )
    case 'footer':
      return (
        <div style={{ padding: '24px 32px', textAlign: 'center', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#9ca3af' }}>{c.brand || 'Mağaza Adı'}</p>
          <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#d1d5db' }}>{c.addr || 'İstanbul, Türkiye'}</p>
          <span style={{ fontSize: '11px', color: '#9ca3af', textDecoration: 'underline' }}>{c.unsub || 'Abonelikten çık'}</span>
        </div>
      )
    case 'testimonial': {
      const stars = Math.min(5, Math.max(1, parseInt(c.stars || '5')))
      return (
        <div style={{ padding: '16px 32px', background: '#fff' }}>
          <div style={{ background: '#f9fafb', borderRadius: '16px', border: '1px solid #f0f0f0', padding: '20px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '16px', color: '#f59e0b' }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</p>
            <p style={{ margin: '0 0 12px', fontSize: '13px', fontStyle: 'italic', color: '#374151', lineHeight: 1.7 }}>"{c.quote || 'Müşteri yorumu...'}"</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#6b7280' }}>
                {(c.name || '?')[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#111827' }}>{c.name || 'Müşteri Adı'}</p>
                {c.role && <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>{c.role}</p>}
              </div>
            </div>
          </div>
        </div>
      )
    }
    case 'countdown':
      return (
        <div style={{ padding: '20px 32px', textAlign: 'center', background: '#fff' }}>
          {c.label && <p style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>{c.label}</p>}
          <div style={{ display: 'inline-flex', gap: '8px' }}>
            {[{ v: c.days || '03', l: 'Gün' }, { v: c.hours || '12', l: 'Saat' }, { v: c.minutes || '45', l: 'Dak' }, { v: c.seconds || '00', l: 'Sn' }].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ background: '#2563eb', borderRadius: '8px', padding: '10px 14px', minWidth: '48px' }}>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1 }}>{v}</p>
                  <p style={{ margin: '3px 0 0', fontSize: '8px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>{l}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'feature_cards':
      return (
        <div style={{ padding: '20px 28px', background: '#fff' }}>
          {c.title && <p style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#111827', textAlign: 'center' }}>{c.title}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[1, 2, 3].map(i => c[`card${i}_title`] ? (
              <div key={i} style={{ background: '#f9fafb', borderRadius: '12px', border: '1px solid #f0f0f0', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{c[`card${i}_icon`] || '📦'}</div>
                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: 700, color: '#111827' }}>{c[`card${i}_title`]}</p>
                <p style={{ margin: 0, fontSize: '10px', color: '#6b7280', lineHeight: 1.5 }}>{c[`card${i}_desc`]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )
    case 'trust_bar':
      return (
        <div style={{ padding: '16px 28px', background: '#f9fafb', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            {[1, 2, 3, 4].map(i => c[`item${i}_text`] ? (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{c[`item${i}_icon`]}</div>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 600, color: '#6b7280' }}>{c[`item${i}_text`]}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )
    case 'discount_section':
      return (
        <div style={{ padding: '36px 32px', textAlign: 'center', background: c.bgColor || '#1d4ed8' }}>
          {c.label && <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '4px' }}>{c.label}</p>}
          <p style={{ margin: '0 0 6px', fontSize: '52px', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{c.discountText || '%30'}</p>
          {c.sub && <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>{c.sub}</p>}
        </div>
      )
    default:
      return <div style={{ padding: '16px', background: '#fff', color: '#9ca3af', textAlign: 'center', fontSize: '12px' }}>{block.type}</div>
  }
}

// ─── Properties panel ─────────────────────────────────────────────────────────

function PropertiesPanel({ block, onChange }: { block: Block; onChange: (id: string, c: Record<string, string>) => void }) {
  const [c, setC] = useState<Record<string, string>>(block.c)

  useEffect(() => { setC(block.c) }, [block.id])

  const upd = (key: string, val: string) => {
    const next = { ...c, [key]: val }
    setC(next)
    onChange(block.id, next)
  }

  const f = (k: string, placeholder?: string) => ({
    value: c[k] ?? '',
    onChange: (v: string) => upd(k, v),
    placeholder,
  })

  const gap: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px' }

  switch (block.type) {
    case 'hero':
      return (
        <div style={gap}>
          <Field label="Başlık" {...f('headline', 'Kampanya başlığı')} />
          <Field label="Alt Başlık" {...f('sub', 'Alt başlık metni')} />
          <Field label="Rozet Metni" {...f('badge', 'YENİ')} />
          <Field label="Arka Plan Rengi" {...f('bgColor')} colorPicker />
          <Field label="Görsel URL (opsiyonel)" {...f('imageUrl', 'https://')} />
        </div>
      )
    case 'text':
      return <Field label="İçerik" {...f('body')} multiline placeholder="E-posta metninizi buraya yazın..." />
    case 'image':
      return (
        <div style={gap}>
          <Field label="Görsel URL" {...f('src', 'https://example.com/image.jpg')} />
          <Field label="Alt Metin" {...f('alt', 'Görsel açıklaması')} />
          <Field label="Bağlantı URL" {...f('link', 'https://')} />
        </div>
      )
    case 'cta':
      return (
        <div style={gap}>
          <Field label="Buton Metni" {...f('label', 'Hemen İncele →')} />
          <Field label="URL" {...f('url', 'https://')} />
          <Field label="Buton Rengi" {...f('color')} colorPicker />
          <Field label="Alt Metin" {...f('sub', 'Ücretsiz kargo · Güvenli ödeme')} />
        </div>
      )
    case 'product':
      return (
        <div style={gap}>
          <Field label="Ürün Adı" {...f('name', 'Ürün Adı')} />
          <Field label="Açıklama" {...f('desc', 'Kısa ürün açıklaması')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Field label="Fiyat" {...f('price', '₺299')} />
            <Field label="Eski Fiyat" {...f('oldPrice', '₺399')} />
          </div>
          <Field label="Görsel URL" {...f('imageUrl', 'https://')} />
        </div>
      )
    case 'coupon':
      return (
        <div style={gap}>
          <Field label="Kupon Kodu" {...f('code', 'INDIRIM20')} />
          <Field label="İndirim Metni" {...f('discount', '%20 İndirim')} />
          <Field label="Geçerlilik Süresi" {...f('expiry', '48 saat geçerli')} />
        </div>
      )
    case 'benefits':
      return <Field label="Maddeler (her satır bir madde)" {...f('items')} multiline placeholder={'Ücretsiz kargo\nKolay iade\nGüvenli ödeme'} />
    case 'footer':
      return (
        <div style={gap}>
          <Field label="Marka / Mağaza Adı" {...f('brand', 'Mağazanız')} />
          <Field label="Adres" {...f('addr', 'İstanbul, Türkiye')} />
          <Field label="Abonelik İptal Linki Metni" {...f('unsub', 'Abonelikten çık')} />
        </div>
      )
    case 'testimonial':
      return (
        <div style={gap}>
          <Field label="Müşteri Yorumu" {...f('quote')} multiline placeholder="Harika bir ürün..." />
          <Field label="Müşteri Adı" {...f('name', 'Müşteri Adı')} />
          <Field label="Ünvan / Rol" {...f('role', 'Doğrulanmış Alıcı')} />
          <Field label="Yıldız Sayısı (1–5)" {...f('stars', '5')} />
          <Field label="Profil Görseli URL" {...f('avatar', 'https://')} />
        </div>
      )
    case 'countdown':
      return (
        <div style={gap}>
          <Field label="Başlık" {...f('label', 'Kampanya bitiyor!')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <Field label="Gün" {...f('days', '03')} />
            <Field label="Saat" {...f('hours', '12')} />
            <Field label="Dakika" {...f('minutes', '45')} />
            <Field label="Saniye" {...f('seconds', '00')} />
          </div>
          <Field label="Alt Metin" {...f('sub')} />
        </div>
      )
    case 'feature_cards':
      return (
        <div style={gap}>
          <Field label="Başlık (opsiyonel)" {...f('title')} />
          {[1, 2, 3].map(i => (
            <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 700, color: '#8080a0', textTransform: 'uppercase' }}>Kart {i}</p>
              <div style={gap}>
                <Field label="İkon (emoji)" {...f(`card${i}_icon`, '📦')} />
                <Field label="Başlık" {...f(`card${i}_title`)} />
                <Field label="Açıklama" {...f(`card${i}_desc`)} />
              </div>
            </div>
          ))}
        </div>
      )
    case 'trust_bar':
      return (
        <div style={gap}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: '8px' }}>
              <Field label={`İkon ${i}`} {...f(`item${i}_icon`)} />
              <Field label={`Metin ${i}`} {...f(`item${i}_text`)} />
            </div>
          ))}
        </div>
      )
    case 'discount_section':
      return (
        <div style={gap}>
          <Field label="Etiket Metni" {...f('label', 'ÖZEL TEKLİF')} />
          <Field label="İndirim Oranı" {...f('discountText', '%30')} />
          <Field label="Alt Metin" {...f('sub')} />
          <Field label="Arka Plan Rengi" {...f('bgColor')} colorPicker />
        </div>
      )
    case 'divider':
      return <p style={{ fontSize: '12px', color: '#8080a0', margin: 0 }}>Bu blok için ayar yoktur.</p>
    default:
      return null
  }
}

// ─── Editor content (inner — needs Suspense for useSearchParams) ──────────────

function EditorContent() {
  const router = useRouter()
  const params = useSearchParams()
  const templateId = params.get('id')
  const presetId = params.get('preset')

  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('Yeni Şablon')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(templateId)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const loadId = templateId ? templateId : presetId ? `preset:${presetId}` : null
      if (loadId) {
        try {
          const res = await fetch(`/api/templates/${loadId}`)
          if (res.ok) {
            const data = await res.json()
            setName(data.name || 'Şablon')
            setSubject(data.subject || '')
            const parsed = typeof data.design === 'string' ? JSON.parse(data.design) : data.design
            if (Array.isArray(parsed)) setBlocks(parsed)
          }
        } catch {}
      }
      setLoading(false)
    }
    load()
  }, [templateId, presetId])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const addBlock = useCallback((type: BlockType) => {
    const b = makeBlock(type)
    setBlocks(prev => [...prev, b])
    setSelectedId(b.id)
    setTimeout(() => {
      document.getElementById('email-canvas')?.scrollTo({ top: 99999, behavior: 'smooth' })
    }, 50)
  }, [])

  const updateBlock = useCallback((id: string, c: Record<string, string>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, c } : b))
  }, [])

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const next = prev.filter(b => b.id !== id)
      setSelectedId(sel => sel === id ? (next[0]?.id ?? null) : sel)
      return next
    })
  }, [])

  const moveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (idx < 0) return prev
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = blocks.map(b => b.c.body || b.c.headline || '').filter(Boolean).join(' ').slice(0, 200) || 'Şablon'
      const payload = { name, subject, body, design: JSON.stringify(blocks), type: 'email' }

      let res: Response
      if (savedId && !savedId.startsWith('preset:')) {
        res = await fetch(`/api/templates/${savedId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.ok) {
          const data = await res.json()
          setSavedId(data.id)
        }
      }
      if (res.ok) showToast('Kaydedildi ✓')
      else showToast('Kaydetme başarısız')
    } catch {
      showToast('Bağlantı hatası')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    setPreviewHtml(renderBlocksToEmailHtml(blocks, { storeName: name }))
    setShowPreview(true)
  }

  const selectedBlock = blocks.find(b => b.id === selectedId) ?? null

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 shrink-0"
        style={{ height: '56px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,8,15,0.98)', backdropFilter: 'blur(24px)' }}>

        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors"
          style={{ color: '#8080a0' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#eeeef4' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#8080a0' }}>
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>

        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

        <div className="flex-1 min-w-0">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Şablon adı"
            className="block w-full bg-transparent outline-none text-[14px] font-semibold"
            style={{ color: '#eeeef4' }} />
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Konu satırı (opsiyonel)"
            className="block w-full bg-transparent outline-none text-[11px]"
            style={{ color: '#44445a' }} />
        </div>

        <div className="text-[11px] px-2.5 py-1 rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', color: '#44445a', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'JetBrains Mono, monospace' }}>
          {blocks.length} blok
        </div>

        <button onClick={handlePreview}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold shrink-0 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#eeeef4', border: '1px solid rgba(255,255,255,0.1)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}>
          <Eye className="w-3.5 h-3.5" /> Önizle
        </button>

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold shrink-0"
          style={{ background: toast?.startsWith('Kaydedildi') ? '#22c97a' : '#4470ff', color: '#fff', opacity: saving ? 0.75 : 1, transition: 'background 0.3s' }}>
          {saving
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : toast?.startsWith('Kaydedildi')
              ? <span>✓ Kaydedildi</span>
              : <><Save className="w-3.5 h-3.5" /> Kaydet</>}
        </button>
      </div>

      {/* ── Three-panel layout ─────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Block palette */}
        <div className="w-56 shrink-0 overflow-y-auto"
          style={{ borderRight: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)' }}>
          <div className="p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-3 px-1" style={{ color: '#33334a' }}>Blok Ekle</p>
            {PALETTE.map(group => (
              <div key={group.group} className="mb-4">
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-1 px-1" style={{ color: '#2a2a3d' }}>{group.group}</p>
                <div className="space-y-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon
                    return (
                      <button key={item.type} onClick={() => addBlock(item.type)}
                        className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-left transition-all group"
                        style={{ color: '#8080a0' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(68,112,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#eeeef4' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#8080a0' }}>
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${item.color}18` }}>
                          <Icon className="w-3 h-3" style={{ color: item.color }} />
                        </div>
                        <span className="text-[11px] font-medium flex-1">{item.label}</span>
                        <Plus className="w-3 h-3 opacity-0 group-hover:opacity-60 shrink-0" style={{ color: '#4470ff' }} />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div id="email-canvas" className="flex-1 overflow-y-auto"
          style={{ background: '#07070e' }}>
          <div className="py-10 px-6">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center" style={{ minHeight: '440px', gap: '16px' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(68,112,255,0.07)', border: '1px solid rgba(68,112,255,0.14)' }}>
                  <Mail className="w-7 h-7" style={{ color: '#4470ff' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="text-[15px] font-semibold mb-1" style={{ color: '#eeeef4' }}>E-posta şablonunuzu oluşturun</p>
                  <p className="text-[12px]" style={{ color: '#33334a' }}>Soldan bir blok seçerek başlayın</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px]"
                  style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.12)', color: '#6690ee' }}>
                  ← Hero Banner ile başlayın
                </div>
              </div>
            ) : (
              <div className="mx-auto rounded-2xl overflow-hidden shadow-2xl" style={{ maxWidth: '600px', background: '#ffffff' }}>
                {blocks.map((block, idx) => {
                  const sel = block.id === selectedId
                  const label = PALETTE_FLAT.find(i => i.type === block.type)?.label ?? block.type
                  return (
                    <div key={block.id} onClick={() => setSelectedId(block.id)}
                      className="relative"
                      style={{ outline: sel ? '2px solid #4470ff' : '2px solid transparent', outlineOffset: '-2px', cursor: 'pointer', transition: 'outline-color 0.12s' }}>

                      {sel && (
                        <>
                          {/* Block type badge */}
                          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md text-[9px] font-bold"
                            style={{ background: '#4470ff', color: '#fff', pointerEvents: 'none' }}>
                            {label}
                          </div>
                          {/* Controls */}
                          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up') }}
                              disabled={idx === 0}
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ background: 'rgba(8,8,15,0.88)', backdropFilter: 'blur(8px)', color: idx === 0 ? '#3e3e54' : '#8080a0', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down') }}
                              disabled={idx === blocks.length - 1}
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ background: 'rgba(8,8,15,0.88)', backdropFilter: 'blur(8px)', color: idx === blocks.length - 1 ? '#3e3e54' : '#8080a0', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); removeBlock(block.id) }}
                              className="w-6 h-6 rounded-md flex items-center justify-center"
                              style={{ background: 'rgba(232,69,69,0.88)', backdropFilter: 'blur(8px)', color: '#fff', border: '1px solid rgba(232,69,69,0.5)' }}>
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}

                      <BlockVisual block={block} />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Properties */}
        <div className="w-72 shrink-0 overflow-y-auto"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.18)' }}>
          {selectedBlock ? (
            <div className="p-4">
              {/* Panel header */}
              <div className="flex items-center gap-2 mb-4 pb-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.18)' }}>
                  <Code className="w-3 h-3" style={{ color: '#4470ff' }} />
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>
                    {PALETTE_FLAT.find(i => i.type === selectedBlock.type)?.label ?? selectedBlock.type}
                  </p>
                  <p className="text-[10px]" style={{ color: '#33334a' }}>Blok Özellikleri</p>
                </div>
              </div>
              <PropertiesPanel block={selectedBlock} onChange={updateBlock} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Code className="w-4 h-4" style={{ color: '#2a2a3d' }} />
              </div>
              <p className="text-[12px] font-medium mb-1" style={{ color: '#44445a' }}>Blok seçin</p>
              <p className="text-[11px]" style={{ color: '#2a2a3d' }}>Tıklayarak özelliklerini düzenleyin</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview modal ────────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowPreview(false)}>
          <div className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ width: '640px', maxHeight: '90vh', background: '#f0f2f5' }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-4 shrink-0"
              style={{ height: '48px', background: 'rgba(8,8,15,0.97)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: '#4470ff' }} />
                <span className="text-[12px] font-semibold" style={{ color: '#eeeef4' }}>E-posta Önizleme</span>
                {subject && <span className="text-[11px] px-2 py-0.5 rounded-md" style={{ background: 'rgba(255,255,255,0.06)', color: '#8080a0' }}>{subject}</span>}
              </div>
              <button onClick={() => setShowPreview(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ color: '#8080a0', background: 'rgba(255,255,255,0.05)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <iframe srcDoc={previewHtml} title="E-posta Önizleme"
                style={{ width: '100%', height: '600px', border: 'none', display: 'block' }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-[12px] font-semibold shadow-xl"
          style={{ background: toast.startsWith('Kaydedildi') ? '#22c97a' : '#e84545', color: '#fff', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </AppShell>
  )
}

export default function NewTemplatePage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#4470ff' }} />
        </div>
      </AppShell>
    }>
      <EditorContent />
    </Suspense>
  )
}
