'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import {
  ArrowLeft, Check, Loader2, Wand2, Type, MousePointer, TrendingUp,
  Target, Camera, Trash2, ChevronUp, ChevronDown, Save, Monitor,
  Smartphone, BookmarkPlus, Sparkles, Plus, Package, Crown,
  GripVertical, CheckCircle, Tag, Minus, Image as ImageIcon,
  Star, Zap, LayoutTemplate, AlignLeft, AlignJustify,
  ShieldCheck, Grid3X3,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import { templatePresets } from '@/lib/email-template-presets'
import type { Block } from '@/lib/email-html-renderer'

/* ─── Types ──────────────────────────────────── */
type Phase = 'gallery' | 'editor'
type RightTab = 'content' | 'ai' | 'image'
type BlockType = Block['type']

/* ─── Block Type Config ──────────────────────── */
type IconComp = React.ComponentType<{ className?: string; style?: React.CSSProperties }>
const BLOCK_CFG: Record<string, { label: string; Icon: IconComp; color: string }> = {
  hero:          { label: 'Hero',          Icon: Monitor,      color: '#6366f1' },
  text:          { label: 'Metin',         Icon: AlignLeft,    color: '#8b5cf6' },
  cta:           { label: 'CTA Butonu',    Icon: MousePointer, color: '#3b82f6' },
  product:       { label: 'Ürün',          Icon: Package,      color: '#10b981' },
  coupon:        { label: 'Kupon',         Icon: Tag,          color: '#f59e0b' },
  benefits:      { label: 'Avantajlar',    Icon: CheckCircle,  color: '#06b6d4' },
  feature_cards: { label: 'Özellik Kartları', Icon: Grid3X3,   color: '#a855f7' },
  trust_bar:     { label: 'Güven Çubuğu', Icon: ShieldCheck,  color: '#14b8a6' },
  image:         { label: 'Görsel',        Icon: ImageIcon,    color: '#ec4899' },
  divider:       { label: 'Ayraç',         Icon: Minus,        color: '#6b7280' },
  footer:        { label: 'Footer',        Icon: AlignJustify, color: '#64748b' },
}
const ADD_TYPES: BlockType[] = ['hero','text','cta','product','coupon','benefits','feature_cards','trust_bar','image','divider','footer']

/* ─── Gallery ────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',      label: 'Tümü' },
  { id: 'cart',     label: 'Sepet Terk' },
  { id: 'vip',      label: 'VIP' },
  { id: 'launch',   label: 'Lansman' },
  { id: 'promo',    label: 'Promosyon' },
  { id: 'birthday', label: 'Özel Gün' },
  { id: 'welcome',  label: 'Hoş Geldin' },
  { id: 'winback',  label: 'Geri Kazan' },
  { id: 'restock',  label: 'Stok Bildirimi' },
]

const SEGMENTS = [
  { value: 'all',      label: 'Tüm Müşteriler' },
  { value: 'vip',      label: 'VIP Müşteriler' },
  { value: 'loyal',    label: 'Sadık Müşteriler' },
  { value: 'at_risk',  label: 'Risk Altındaki' },
  { value: 'new',      label: 'Yeni Müşteriler' },
  { value: 'inactive', label: 'Pasif Müşteriler' },
]

function defaultContent(type: BlockType, storeName: string): Record<string, string> {
  switch (type) {
    case 'hero':          return { headline: '⚡ Özel Kampanya', sub: 'Size özel bir fırsat hazırladık', badge: 'Sınırlı Süre', bgColor: '#0a1628' }
    case 'text':          return { body: 'Merhaba {{isim}},\n\nBu özel kampanyayı kaçırmayın.' }
    case 'cta':           return { label: 'Hemen İncele →', sub: 'Ücretsiz kargo · Güvenli ödeme', color: '#3b82f6', url: '#' }
    case 'product':       return { name: 'Ürün Adı', desc: 'Kısa açıklama', price: '₺299', oldPrice: '₺399' }
    case 'coupon':        return { code: 'SAVE15', discount: '%15 İndirim', expiry: '3 gün geçerli' }
    case 'benefits':      return { items: 'Ücretsiz kargo\nKolay iade\nGüvenli SSL ödeme' }
    case 'feature_cards': return { card1_icon: '🚀', card1_title: 'Hızlı Teslimat', card1_desc: '24 saat içinde kapında', card2_icon: '💎', card2_title: 'Premium Kalite', card2_desc: 'Seçkin malzemeler', card3_icon: '🔄', card3_title: 'Kolay İade', card3_desc: '30 gün iade garantisi' }
    case 'trust_bar':     return { item1_icon: '🚚', item1_text: 'Ücretsiz Kargo', item2_icon: '↩️', item2_text: 'Kolay İade', item3_icon: '🔒', item3_text: 'Güvenli Ödeme', item4_icon: '⭐', item4_text: 'Müşteri Desteği' }
    case 'image':         return { src: '', alt: '' }
    case 'footer':        return { brand: storeName, addr: 'İstanbul, Türkiye', unsub: 'Abonelikten çık' }
    default:              return {}
  }
}

/* ─── AI Quick Actions ───────────────────────── */
const AI_ACTIONS = [
  { label: 'Daha premium',  icon: Crown,        color: '#f59e0b', instruction: 'İçeriği daha lüks, premium ve sofistike bir tona çevir. Marka algısını yükselt.' },
  { label: 'Satış odaklı',  icon: TrendingUp,   color: '#34d399', instruction: 'Dönüşüm ve satışa odaklan. Güçlü CTA, aciliyet ve faydaları öne çıkar.' },
  { label: 'Başlık yenile', icon: Type,         color: '#b3c5ff', instruction: 'Hero bloğun başlığını daha çarpıcı yap.' },
  { label: 'CTA güçlendir', icon: MousePointer, color: '#a78bfa', instruction: 'CTA buton metnini daha ikna edici ve aksiyon odaklı yap.' },
  { label: 'Kısa & güçlü', icon: Zap,          color: '#fbbf24', instruction: 'Tüm metinleri kısalt. Her cümle güçlü olsun.' },
  { label: 'Kişiselleştir', icon: Target,       color: '#fb923c', instruction: '{{isim}} değişkenini kullanarak metni daha kişisel yap.' },
]

/* ═══════════════════════════════════════════════
   BLOCK PREVIEW RENDERERS
═══════════════════════════════════════════════ */

function HeroPreview({ c }: { c: Record<string, string> }) {
  return (
    <div className="relative px-8 py-12 text-center overflow-hidden" style={{ background: c.bgColor || '#0a1628', minHeight: 180 }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />
      {c.badge && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border mb-4" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {c.badge}
        </div>
      )}
      {c.imageUrl && <img src={c.imageUrl} alt="" className="w-full max-h-48 object-cover rounded-xl mb-4" />}
      <h1 className="text-2xl font-black text-white leading-tight mb-2">{c.headline || 'Kampanya Başlığı'}</h1>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{c.sub || ''}</p>
    </div>
  )
}

function TextPreview({ c }: { c: Record<string, string> }) {
  return (
    <div className="px-8 py-6">
      <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#374151' }}>{c.body || 'Metin bloğu...'}</p>
    </div>
  )
}

function CTAPreview({ c }: { c: Record<string, string> }) {
  return (
    <div className="px-8 py-6 flex flex-col items-center gap-2">
      <div className="px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg" style={{ background: c.color || '#3b82f6' }}>
        {c.label || 'Hemen İncele →'}
      </div>
      {c.sub && <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>{c.sub}</p>}
    </div>
  )
}

function ProductPreview({ c }: { c: Record<string, string> }) {
  return (
    <div className="px-6 py-4">
      <div className="flex gap-4 border rounded-2xl p-4" style={{ borderColor: '#f0f0f0' }}>
        {c.imageUrl
          ? <img src={c.imageUrl} alt={c.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
          : <div className="w-20 h-20 rounded-xl shrink-0 flex items-center justify-center" style={{ background: '#f5f5f7' }}><Package className="w-8 h-8" style={{ color: '#d1d5db' }} /></div>
        }
        <div className="flex-1 space-y-1 pt-1">
          <p className="font-bold text-sm" style={{ color: '#111827' }}>{c.name || 'Ürün Adı'}</p>
          <p className="text-xs" style={{ color: '#6b7280' }}>{c.desc || ''}</p>
          <div className="flex items-center gap-2 pt-1">
            <span className="font-black text-base" style={{ color: '#3b82f6' }}>{c.price || '₺299'}</span>
            {c.oldPrice && <span className="text-xs line-through" style={{ color: '#9ca3af' }}>{c.oldPrice}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function CouponPreview({ c }: { c: Record<string, string> }) {
  return (
    <div className="px-6 py-4">
      <div className="border-2 border-dashed rounded-2xl p-6 text-center" style={{ borderColor: '#3b82f6', background: '#eff6ff' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#6b7280' }}>İndirim Kodu</p>
        <p className="text-3xl font-black tracking-[0.15em] font-mono" style={{ color: '#111827' }}>{c.code || 'SAVE20'}</p>
        <p className="text-sm font-semibold mt-1" style={{ color: '#2563eb' }}>{c.discount || ''}</p>
        {c.expiry && <p className="text-xs mt-2" style={{ color: '#9ca3af' }}>{c.expiry}</p>}
      </div>
    </div>
  )
}

function BenefitsPreview({ c }: { c: Record<string, string> }) {
  const items = (c.items || 'Ücretsiz kargo\nKolay iade\nGüvenli ödeme').split('\n').filter(Boolean)
  return (
    <div className="px-8 py-5 space-y-2.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} />
          <span className="text-sm font-medium" style={{ color: '#374151' }}>{item.replace(/^[✓✗·\-*]\s?/, '')}</span>
        </div>
      ))}
    </div>
  )
}

function FeatureCardsPreview({ c }: { c: Record<string, string> }) {
  const cards = [1, 2, 3].map(i => ({ icon: c[`card${i}_icon`], title: c[`card${i}_title`], desc: c[`card${i}_desc`] })).filter(card => card.title)
  return (
    <div className="px-6 py-6">
      {c.title && <p className="text-center font-bold text-sm mb-4" style={{ color: '#111827' }}>{c.title}</p>}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cards.length || 3}, 1fr)` }}>
        {cards.map((card, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: '#f9fafb', border: '1px solid #f0f0f0' }}>
            <p className="text-2xl mb-2">{card.icon}</p>
            <p className="text-xs font-bold mb-1" style={{ color: '#111827' }}>{card.title}</p>
            <p className="text-[11px] leading-relaxed" style={{ color: '#6b7280' }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrustBarPreview({ c }: { c: Record<string, string> }) {
  const items = [1, 2, 3, 4].map(i => ({ icon: c[`item${i}_icon`], text: c[`item${i}_text`] })).filter(item => item.text)
  return (
    <div className="px-6 py-4" style={{ background: '#f9fafb', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
      <div className="flex justify-around">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-xl">{item.icon}</span>
            <span className="text-[11px] font-semibold" style={{ color: '#6b7280' }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FooterPreview({ c }: { c: Record<string, string> }) {
  return (
    <div className="px-8 py-6 text-center" style={{ borderTop: '1px solid #f9fafb', background: '#fafafa' }}>
      <p className="text-xs font-bold mb-1" style={{ color: '#9ca3af' }}>{c.brand || 'Mağazanız'}</p>
      <p className="text-[11px] mb-2" style={{ color: '#d1d5db' }}>{c.addr || 'İstanbul, Türkiye'}</p>
      <span className="text-[11px] underline" style={{ color: '#9ca3af' }}>Aboneliği iptal et</span>
    </div>
  )
}

function BlockPreview({ block }: { block: Block }) {
  switch (block.type) {
    case 'hero':          return <HeroPreview c={block.c} />
    case 'text':          return <TextPreview c={block.c} />
    case 'cta':           return <CTAPreview c={block.c} />
    case 'product':       return <ProductPreview c={block.c} />
    case 'coupon':        return <CouponPreview c={block.c} />
    case 'benefits':      return <BenefitsPreview c={block.c} />
    case 'feature_cards': return <FeatureCardsPreview c={block.c} />
    case 'trust_bar':     return <TrustBarPreview c={block.c} />
    case 'image':         return block.c.src
      ? <div className="px-6 py-3"><img src={block.c.src} alt={block.c.alt || ''} className="w-full rounded-xl object-cover max-h-56" /></div>
      : <div className="px-6 py-5 text-center text-xs" style={{ color: '#9ca3af' }}>Görsel seçilmedi</div>
    case 'divider':       return <div className="mx-8 py-2"><div style={{ height: 1, background: '#f0f0f0' }} /></div>
    case 'footer':        return <FooterPreview c={block.c} />
    default:              return null
  }
}

/* ─── Block Property Form ────────────────────── */

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#5a5f72' }}>{label}</label>
      {children}
    </div>
  )
}

const IS = { background: '#0e0e14', border: '1px solid rgba(255,255,255,0.07)', color: '#e8eaf0' } // inputStyle

function BlockPropertyForm({ block, onUpdate }: { block: Block; onUpdate: (f: string, v: string) => void }) {
  const inp = (label: string, field: string, ph = '') => (
    <F label={label}>
      <input type="text" value={block.c[field] || ''} onChange={e => onUpdate(field, e.target.value)} placeholder={ph}
        className="w-full px-3 py-2 text-xs rounded-lg outline-none transition-all" style={IS} />
    </F>
  )
  const area = (label: string, field: string, rows = 4) => (
    <F label={label}>
      <textarea value={block.c[field] || ''} onChange={e => onUpdate(field, e.target.value)} rows={rows}
        className="w-full px-3 py-2 text-xs rounded-lg outline-none resize-none" style={IS} />
    </F>
  )
  const clr = (label: string, field: string, fallback = '#3b82f6') => (
    <F label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={block.c[field] || fallback} onChange={e => onUpdate(field, e.target.value)}
          className="w-8 h-8 rounded cursor-pointer" style={{ padding: 2, background: 'transparent', border: 'none' }} />
        <input type="text" value={block.c[field] || fallback} onChange={e => onUpdate(field, e.target.value)}
          className="flex-1 px-3 py-2 text-xs rounded-lg outline-none" style={IS} />
      </div>
    </F>
  )

  switch (block.type) {
    case 'hero':
      return <div className="space-y-4">{inp('Başlık', 'headline')}{inp('Alt Başlık', 'sub')}{inp('Rozet Metni', 'badge', 'ör. Sınırlı Süre')}{inp('Görsel URL', 'imageUrl', 'https://...')}{clr('Arka Plan Rengi', 'bgColor', '#0a1628')}</div>
    case 'text':
      return <div>{area('Metin İçeriği', 'body', 7)}</div>
    case 'cta':
      return <div className="space-y-4">{inp('Buton Metni', 'label', 'Hemen İncele →')}{inp('Hedef URL', 'url', 'https://...')}{inp('Alt Metin', 'sub')}{clr('Buton Rengi', 'color', '#3b82f6')}</div>
    case 'product':
      return <div className="space-y-4">{inp('Ürün Adı', 'name')}{inp('Açıklama', 'desc')}{inp('Fiyat', 'price', '₺299')}{inp('Eski Fiyat', 'oldPrice', '₺399')}{inp('Görsel URL', 'imageUrl', 'https://...')}{inp('Ürün Linki', 'url', 'https://...')}</div>
    case 'coupon':
      return <div className="space-y-4">{inp('Kupon Kodu', 'code', 'SAVE15')}{inp('İndirim Açıklaması', 'discount', '%15 İndirim')}{inp('Son Kullanma', 'expiry', '3 gün geçerli')}</div>
    case 'benefits':
      return <div className="space-y-4">{area('Avantajlar (her satıra bir madde)', 'items', 5)}</div>
    case 'feature_cards':
      return (
        <div className="space-y-5">
          {inp('Başlık (opsiyonel)', 'title', 'Neden Bizi Seçin?')}
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl p-3 space-y-2.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#424656' }}>{i}. Kart</p>
              <div className="flex gap-2">
                <input type="text" value={block.c[`card${i}_icon`] || ''} onChange={e => onUpdate(`card${i}_icon`, e.target.value)} placeholder="🚀"
                  className="w-10 px-2 py-2 text-center text-sm rounded-lg outline-none" style={IS} />
                <input type="text" value={block.c[`card${i}_title`] || ''} onChange={e => onUpdate(`card${i}_title`, e.target.value)} placeholder="Başlık"
                  className="flex-1 px-3 py-2 text-xs rounded-lg outline-none" style={IS} />
              </div>
              <input type="text" value={block.c[`card${i}_desc`] || ''} onChange={e => onUpdate(`card${i}_desc`, e.target.value)} placeholder="Açıklama"
                className="w-full px-3 py-2 text-xs rounded-lg outline-none" style={IS} />
            </div>
          ))}
        </div>
      )
    case 'trust_bar':
      return (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-2">
              <input type="text" value={block.c[`item${i}_icon`] || ''} onChange={e => onUpdate(`item${i}_icon`, e.target.value)}
                placeholder="🚚" className="w-10 px-2 py-2 text-center text-sm rounded-lg outline-none" style={IS} />
              <input type="text" value={block.c[`item${i}_text`] || ''} onChange={e => onUpdate(`item${i}_text`, e.target.value)}
                placeholder={`${i}. güven maddesi`} className="flex-1 px-3 py-2 text-xs rounded-lg outline-none" style={IS} />
            </div>
          ))}
        </div>
      )
    case 'footer':
      return <div className="space-y-4">{inp('Marka Adı', 'brand')}{inp('Adres', 'addr', 'İstanbul, Türkiye')}{inp('Abonelik İptal Metni', 'unsub', 'Abonelikten çık')}</div>
    default:
      return <p className="text-xs py-4 text-center" style={{ color: '#424656' }}>Bu blok için düzenleme yok.</p>
  }
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */

function NewCampaignInner() {
  const router      = useRouter()
  const params      = useSearchParams()
  const { data: s } = useSession()
  const storeName   = (s?.user as Record<string, string>)?.storeName || 'Mağazam'

  const [phase,       setPhase]       = useState<Phase>('gallery')
  const [category,    setCategory]    = useState('all')
  const [blocks,      setBlocks]      = useState<Block[]>([])
  const [selectedId,  setSelectedId]  = useState<string | null>(null)
  const [draggingId,  setDraggingId]  = useState<string | null>(null)
  const [dragOverId,  setDragOverId]  = useState<string | null>(null)
  const [name,        setName]        = useState('')
  const [subject,     setSubject]     = useState('')
  const [segment,     setSegment]     = useState('all')
  const [preview,     setPreview]     = useState<'desktop' | 'mobile'>('desktop')
  const [rightTab,    setRightTab]    = useState<RightTab>('content')
  const [showAdd,     setShowAdd]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [savingTpl,   setSavingTpl]   = useState(false)
  const [savedTpl,    setSavedTpl]    = useState(false)
  const [aiMsgs,      setAiMsgs]      = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [aiInput,     setAiInput]     = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [imgPrompt,   setImgPrompt]   = useState('')
  const [imgLoading,  setImgLoading]  = useState(false)
  const aiEndRef = useRef<HTMLDivElement>(null)

  /* auto-load from ?template= param */
  useEffect(() => {
    const t = params.get('template')
    if (!t) return
    const preset = templatePresets.find(p => p.id === t)
    if (preset?.blocks?.length) {
      setBlocks(preset.blocks.map(b => ({ ...b, id: `${b.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` })))
      setName(preset.name); setSubject(preset.defaultSubject || ''); setPhase('editor')
    }
  }, [params])

  useEffect(() => {
    if (aiEndRef.current) aiEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [aiMsgs])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target as Element).closest('[data-addmenu]')) setShowAdd(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  /* ─── Load template ─── */
  function loadTemplate(tpl: typeof templatePresets[0]) {
    const fresh = tpl.blocks.length
      ? tpl.blocks.map(b => ({ ...b, id: `${b.id}_${Date.now()}_${Math.random().toString(36).slice(2)}` }))
      : ([
          { id: `h_${Date.now()}`, type: 'hero'   as BlockType, c: defaultContent('hero',   storeName) },
          { id: `c_${Date.now()}`, type: 'cta'    as BlockType, c: defaultContent('cta',    storeName) },
          { id: `f_${Date.now()}`, type: 'footer' as BlockType, c: defaultContent('footer', storeName) },
        ] as Block[])
    setBlocks(fresh); setName(tpl.name); setSubject(tpl.defaultSubject || ''); setSelectedId(null); setPhase('editor')
  }

  function startBlank() {
    setBlocks([
      { id: `h_${Date.now()}`, type: 'hero',   c: defaultContent('hero',   storeName) },
      { id: `t_${Date.now()}`, type: 'text',   c: defaultContent('text',   storeName) },
      { id: `c_${Date.now()}`, type: 'cta',    c: defaultContent('cta',    storeName) },
      { id: `f_${Date.now()}`, type: 'footer', c: defaultContent('footer', storeName) },
    ] as Block[])
    setName('Yeni Kampanya'); setSubject(''); setSelectedId(null); setPhase('editor')
  }

  /* ─── Block ops ─── */
  function addBlock(type: BlockType) {
    const id = `b_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const nb: Block = { id, type, c: defaultContent(type, storeName) }
    setBlocks(prev => {
      const fi = prev.findIndex(b => b.type === 'footer')
      const n = [...prev]; fi >= 0 ? n.splice(fi, 0, nb) : n.push(nb); return n
    })
    setSelectedId(id); setShowAdd(false); setRightTab('content')
  }

  function updateBlock(id: string, f: string, v: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, c: { ...b.c, [f]: v } } : b))
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === id)
      if (dir === 'up' && i === 0) return prev
      if (dir === 'down' && i === prev.length - 1) return prev
      const n = [...prev]; const s = dir === 'up' ? i - 1 : i + 1;[n[i], n[s]] = [n[s], n[i]]; return n
    })
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return }
    setBlocks(prev => {
      const from = prev.findIndex(b => b.id === draggingId)
      const to   = prev.findIndex(b => b.id === targetId)
      const n = [...prev]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n
    })
    setDraggingId(null); setDragOverId(null)
  }

  /* ─── AI fills fields ─── */
  async function sendAiMessage(msg: string) {
    if (!msg.trim() || aiLoading) return
    setAiMsgs(prev => [...prev, { role: 'user', text: msg }])
    setAiInput(''); setAiLoading(true)
    try {
      const res  = await fetch('/api/ai/edit-blocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blocks, instruction: msg, storeName, channel: 'email' }) })
      const data = await res.json()
      if (data.blocks && Array.isArray(data.blocks)) {
        setBlocks(data.blocks)
        setAiMsgs(prev => [...prev, { role: 'assistant', text: '✅ Değişiklik uygulandı!' }])
      } else {
        setAiMsgs(prev => [...prev, { role: 'assistant', text: `⚠️ ${data.error || 'Değişiklik uygulanamadı.'}` }])
      }
    } catch {
      setAiMsgs(prev => [...prev, { role: 'assistant', text: '⚠️ Bağlantı hatası.' }])
    } finally { setAiLoading(false) }
  }

  /* ─── Fal AI image (hero/banner only) ─── */
  async function generateImage() {
    if (!imgPrompt.trim() || imgLoading) return
    setImgLoading(true)
    try {
      const res  = await fetch('/api/ai/generate-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: `${storeName} ${imgPrompt}`, style: 'photorealistic', width: 600, height: 300 }) })
      const data = await res.json()
      if (data.url) {
        const hero = blocks.find(b => b.type === 'hero')
        if (hero) { updateBlock(hero.id, 'imageUrl', data.url); setSelectedId(hero.id); setRightTab('content') }
        else {
          const id = `img_${Date.now()}`
          setBlocks(prev => [{ id, type: 'image', c: { src: data.url, alt: imgPrompt } } as Block, ...prev])
        }
        setImgPrompt('')
      }
    } catch {} finally { setImgLoading(false) }
  }

  /* ─── Save ─── */
  async function handleSave() {
    setSaving(true)
    try {
      const { renderBlocksToEmailHtml } = await import('@/lib/email-html-renderer')
      const body = renderBlocksToEmailHtml(blocks, { storeName, accentColor: '#3b82f6', ctaBaseUrl: '' })
      const res  = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || 'Yeni Kampanya', type: 'email', status: 'draft', segment, subject: subject || name, body, design: JSON.stringify(blocks), tips: [] }) })
      if (res.ok) { setSaved(true); setTimeout(() => router.push('/campaigns'), 1400) }
    } finally { setSaving(false) }
  }

  async function handleSaveTemplate() {
    setSavingTpl(true)
    try {
      const { renderBlocksToEmailHtml } = await import('@/lib/email-html-renderer')
      const body = renderBlocksToEmailHtml(blocks, { storeName, accentColor: '#3b82f6' })
      await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name || 'Şablonum', type: 'email', category: 'custom', subject, body, design: JSON.stringify(blocks) }) })
      setSavedTpl(true); setTimeout(() => setSavedTpl(false), 2500)
    } finally { setSavingTpl(false) }
  }

  const selectedBlock  = blocks.find(b => b.id === selectedId) || null
  const visibleTpls    = templatePresets.filter(t => /^t\d+$/.test(t.id)).filter(t => category === 'all' || t.category === category)

  /* ═════════════════════════════════════════════
     GALLERY PHASE
  ═════════════════════════════════════════════ */
  if (phase === 'gallery') {
    return (
      <AppShell>
        <div className="flex-1 overflow-y-auto" style={{ background: '#10131c' }}>
          <div className="max-w-5xl mx-auto px-6 py-10">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black" style={{ color: '#e8eaf0' }}>Yeni Kampanya</h1>
                <p className="text-sm mt-1" style={{ color: '#5a5f72' }}>Şablon seçin veya boş başlayın</p>
              </div>
              <button onClick={startBlank}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: 'rgba(179,197,255,0.08)', border: '1px solid rgba(179,197,255,0.15)', color: '#b3c5ff' }}>
                <Plus className="w-3.5 h-3.5" />Boş Başla
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.id)}
                  className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={category === cat.id
                    ? { background: 'rgba(179,197,255,0.12)', color: '#b3c5ff', border: '1px solid rgba(179,197,255,0.2)' }
                    : { background: 'transparent', color: '#5a5f72', border: '1px solid transparent' }}>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visibleTpls.map(tpl => (
                <button key={tpl.id} onClick={() => loadTemplate(tpl)}
                  className="group relative text-left rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(179,197,255,0.2)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '3/4', background: '#0a0a0f' }}>
                    {tpl.imageUrl
                      ? <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      : <div className={`w-full h-full bg-gradient-to-b ${tpl.heroGrad} flex items-center justify-center`}>
                          <div className="space-y-1 w-3/4">
                            <div className="h-1 rounded-full" style={{ background: tpl.accent, opacity: 0.8 }} />
                            <div className="h-3 rounded-full bg-white/40" />
                            <div className="h-1.5 rounded-full bg-white/20" />
                          </div>
                        </div>
                    }
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.5)' }}>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(179,197,255,0.15)', color: '#b3c5ff', border: '1px solid rgba(179,197,255,0.3)', backdropFilter: 'blur(8px)' }}>Kullan</span>
                    </div>
                    {tpl.isPremium && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)', fontSize: 9, fontWeight: 700 }}>
                        <Crown className="w-2.5 h-2.5" />PRO
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[11px] font-semibold truncate mb-0.5" style={{ color: '#e8eaf0' }}>{tpl.name}</p>
                    <span className={`text-[9px] font-bold ${tpl.tagColor}`}>{tpl.tag}</span>
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      </AppShell>
    )
  }

  /* ═════════════════════════════════════════════
     EDITOR PHASE  (Klaviyo-style 3-panel)
  ═════════════════════════════════════════════ */
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0c0d12', fontFamily: 'Inter, sans-serif' }}>

      {/* Top Bar */}
      <header className="shrink-0 flex items-center gap-3 px-5 z-40" style={{ height: 56, background: '#13141b', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setPhase('gallery')} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: '#5a5f72' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Kampanya adı..."
          className="bg-transparent outline-none text-sm font-bold border-b border-transparent focus:border-[#b3c5ff]/30 transition-colors pb-0.5 max-w-[220px]"
          style={{ color: '#e8eaf0' }} />
        <div className="flex-1" />
        <div className="flex items-center rounded-lg p-1 gap-0.5" style={{ background: '#1d1f28' }}>
          {(['desktop', 'mobile'] as const).map(m => (
            <button key={m} onClick={() => setPreview(m)}
              className="p-1.5 rounded-md transition-all"
              style={preview === m ? { background: '#272a33', color: '#b3c5ff' } : { color: '#5a5f72' }}>
              {m === 'desktop' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
        <button onClick={handleSaveTemplate} disabled={savingTpl || savedTpl}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={savedTpl ? { background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' } : { border: '1px solid rgba(255,255,255,0.07)', color: '#5a5f72' }}>
          {savingTpl ? <Loader2 className="w-3 h-3 animate-spin" /> : savedTpl ? <Check className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
          {savedTpl ? 'Kaydedildi' : 'Şablon Kaydet'}
        </button>
        <button onClick={handleSave} disabled={saving || saved}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          style={saved ? { background: 'rgba(16,185,129,0.85)', color: 'white' } : { background: '#4f6ef7', color: 'white', boxShadow: '0 0 16px rgba(79,110,247,0.3)' }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : <Save className="w-3 h-3" />}
          {saved ? 'Kaydedildi' : 'Yayınla'}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Block Nav ── */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 224, background: '#13141b', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Campaign settings */}
          <div className="p-3.5 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#424656' }}>Konu</p>
              <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email konusu..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-none" style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.05)', color: '#e8eaf0' }} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#424656' }}>Segment</p>
              <select value={segment} onChange={e => setSegment(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg outline-none appearance-none" style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.05)', color: '#e8eaf0' }}>
                {SEGMENTS.map(seg => <option key={seg.value} value={seg.value}>{seg.label}</option>)}
              </select>
            </div>
          </div>

          {/* Block list header */}
          <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#424656' }}>Bloklar</p>
          </div>

          {/* Block list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {blocks.map((block, idx) => {
              const cfg = BLOCK_CFG[block.type] || BLOCK_CFG.text
              const Icon = cfg.Icon
              const isSelected = selectedId === block.id
              return (
                <div key={block.id}
                  draggable
                  onDragStart={() => setDraggingId(block.id)}
                  onDragOver={e => { e.preventDefault(); setDragOverId(block.id) }}
                  onDrop={() => handleDrop(block.id)}
                  onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
                  onClick={() => { setSelectedId(block.id); setRightTab('content') }}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group transition-all"
                  style={{
                    background: isSelected ? 'rgba(179,197,255,0.08)' : dragOverId === block.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: isSelected ? '1px solid rgba(179,197,255,0.15)' : '1px solid transparent',
                    opacity: draggingId === block.id ? 0.4 : 1,
                  }}
                >
                  <GripVertical className="w-3 h-3 shrink-0 opacity-0 group-hover:opacity-30 transition-opacity cursor-grab" style={{ color: '#424656' }} />
                  <Icon className="w-3 h-3 shrink-0" style={{ color: cfg.color }} />
                  <span className="text-xs font-medium flex-1 truncate" style={{ color: isSelected ? '#b3c5ff' : '#8c90a1' }}>{cfg.label}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'up') }} disabled={idx === 0} className="p-0.5 rounded hover:text-white disabled:opacity-20 transition-colors" style={{ color: '#424656' }}><ChevronUp className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 'down') }} disabled={idx === blocks.length - 1} className="p-0.5 rounded hover:text-white disabled:opacity-20 transition-colors" style={{ color: '#424656' }}><ChevronDown className="w-3 h-3" /></button>
                    <button onClick={e => { e.stopPropagation(); deleteBlock(block.id) }} className="p-0.5 rounded hover:text-red-400 transition-colors" style={{ color: '#424656' }}><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add block */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="relative" data-addmenu="">
              <button onClick={() => setShowAdd(v => !v)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ background: 'rgba(179,197,255,0.06)', border: '1px solid rgba(179,197,255,0.12)', color: '#b3c5ff' }}>
                <Plus className="w-3.5 h-3.5" />Blok Ekle
              </button>
              {showAdd && (
                <div className="absolute bottom-full left-0 right-0 mb-1 rounded-xl overflow-hidden shadow-2xl z-50" style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {ADD_TYPES.map(type => {
                    const cfg = BLOCK_CFG[type]; if (!cfg) return null
                    const Icon = cfg.Icon
                    return (
                      <button key={type} onClick={() => addBlock(type)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/[0.04]" style={{ color: '#8c90a1' }}>
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: cfg.color }} />{cfg.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER: Email Preview ── */}
        <main className="flex-1 overflow-y-auto flex flex-col" style={{ background: '#0c0d12' }}>
          <div className="flex-1 flex justify-center py-8 px-4">
            <div className="transition-all duration-300 rounded-2xl overflow-hidden shadow-2xl"
              style={{
                width: '100%', maxWidth: preview === 'mobile' ? 400 : 600,
                background: '#ffffff',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 80px rgba(0,0,0,0.6)',
              }}>
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                  <LayoutTemplate className="w-12 h-12" style={{ color: '#e8eaf0' }} />
                  <p className="text-sm font-medium" style={{ color: '#9ca3af' }}>Blok eklemek için soldaki paneli kullanın</p>
                </div>
              ) : blocks.map(block => (
                <div key={block.id}
                  onClick={() => { setSelectedId(block.id); setRightTab('content') }}
                  className="relative cursor-pointer transition-all"
                  style={{ outline: selectedId === block.id ? '2px solid rgba(79,110,247,0.6)' : '2px solid transparent', outlineOffset: -2 }}
                >
                  {selectedId === block.id && (
                    <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide" style={{ background: '#4f6ef7', color: 'white' }}>
                      {BLOCK_CFG[block.type]?.label || block.type}
                    </div>
                  )}
                  <BlockPreview block={block} />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* ── RIGHT: Properties + AI + Image ── */}
        <aside className="shrink-0 flex flex-col overflow-hidden" style={{ width: 300, background: '#13141b', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {([{ id: 'content', label: 'İçerik' }, { id: 'ai', label: 'AI' }, { id: 'image', label: 'Görsel' }] as { id: RightTab; label: string }[]).map(tab => (
              <button key={tab.id} onClick={() => setRightTab(tab.id)}
                className="flex-1 py-3 text-[11px] font-semibold transition-all relative"
                style={rightTab === tab.id ? { color: '#b3c5ff', borderBottom: '2px solid #b3c5ff', background: 'rgba(179,197,255,0.03)' } : { color: '#424656', borderBottom: '2px solid transparent' }}>
                {tab.label}
                {tab.id === 'ai' && <span className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full" style={{ background: '#4f6ef7', boxShadow: '0 0 6px #4f6ef7' }} />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* Content tab */}
            {rightTab === 'content' && (
              <div className="p-4">
                {selectedBlock ? (
                  <>
                    <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      {(() => { const c = BLOCK_CFG[selectedBlock.type]; const I = c?.Icon; return I ? <I className="w-4 h-4" style={{ color: c.color }} /> : null })()}
                      <span className="text-xs font-bold" style={{ color: '#e8eaf0' }}>{BLOCK_CFG[selectedBlock.type]?.label}</span>
                    </div>
                    <BlockPropertyForm block={selectedBlock} onUpdate={(f, v) => updateBlock(selectedBlock.id, f, v)} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <MousePointer className="w-5 h-5" style={{ color: '#424656' }} />
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#424656' }}>Ortadaki önizlemeden<br />bir blok seçin</p>
                  </div>
                )}
              </div>
            )}

            {/* AI tab */}
            {rightTab === 'ai' && (
              <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-3" style={{ color: '#424656' }}>Hızlı Aksiyonlar</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {AI_ACTIONS.map(action => {
                      const Icon = action.icon
                      return (
                        <button key={action.label} onClick={() => sendAiMessage(action.instruction)} disabled={aiLoading}
                          className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-left transition-all disabled:opacity-40 hover:bg-white/[0.03]"
                          style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Icon className="w-3 h-3 shrink-0" style={{ color: action.color }} />
                          <span className="text-[10px] font-semibold leading-tight" style={{ color: '#8c90a1' }}>{action.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {aiMsgs.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <Wand2 className="w-8 h-8" style={{ color: 'rgba(179,197,255,0.2)' }} />
                      <p className="text-xs" style={{ color: '#424656' }}>AI şablonunuzun metin alanlarını doldurur. Komut yazın veya hızlı aksiyon seçin.</p>
                    </div>
                  ) : aiMsgs.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[90%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line"
                        style={msg.role === 'user' ? { background: '#4f6ef7', color: 'white' } : { background: '#1d1f28', border: '1px solid rgba(255,255,255,0.05)', color: '#e8eaf0' }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2.5 rounded-xl flex items-center gap-1.5" style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#b3c5ff', animationDelay: `${i * 0.15}s` }} />)}
                      </div>
                    </div>
                  )}
                  <div ref={aiEndRef} />
                </div>
                <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="flex gap-2">
                    <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage(aiInput) } }}
                      placeholder="AI komut girin..." disabled={aiLoading}
                      className="flex-1 px-3 py-2 text-xs rounded-lg outline-none"
                      style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.06)', color: '#e8eaf0' }} />
                    <button onClick={() => sendAiMessage(aiInput)} disabled={!aiInput.trim() || aiLoading}
                      className="px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                      style={{ background: '#4f6ef7', color: 'white' }}>
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Image tab — Fal AI */}
            {rightTab === 'image' && (
              <div className="p-4 space-y-5">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#424656' }}>Fal AI — Kampanya Görseli</p>
                  <p className="text-[10px] leading-relaxed mb-3" style={{ color: '#5a5f72' }}>
                    Hero bölümü için AI banner veya ürün kampanya görseli üretin. Fal AI kullanır.
                  </p>
                  <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
                    placeholder="ör. premium moda ürün fotoğrafı, beyaz arka plan, studio ışığı, ultrarealist..."
                    rows={4}
                    className="w-full px-3 py-2.5 text-xs rounded-lg outline-none resize-none mb-3"
                    style={{ background: '#1d1f28', border: '1px solid rgba(255,255,255,0.06)', color: '#e8eaf0' }} />
                  <button onClick={generateImage} disabled={!imgPrompt.trim() || imgLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                    {imgLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Üretiliyor...</> : <><Camera className="w-3.5 h-3.5" />Görsel Üret</>}
                  </button>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 16 }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#424656' }}>Bilgi</p>
                  <p className="text-[10px] leading-relaxed" style={{ color: '#5a5f72' }}>
                    Üretilen görsel otomatik olarak hero bloğunuza eklenir. Hero bloğu yoksa görsel bloğu olarak en üste eklenir.
                  </p>
                </div>
              </div>
            )}

          </div>
        </aside>
      </div>
    </div>
  )
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ background: '#0c0d12' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#b3c5ff' }} />
      </div>
    }>
      <NewCampaignInner />
    </Suspense>
  )
}
