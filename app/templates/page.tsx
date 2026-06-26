'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  Plus, Search, Eye, Mail, MessageSquare, Zap,
  Filter, Check, Loader2, Trash2, Edit3, FileText,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, formatNumber } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = 'email' | 'whatsapp' | 'automation'

interface PresetTemplate {
  id: string
  name: string
  type: string
  category: string
  subject: string
  isPreset: true
  tag?: string
  tagColor?: string
  rate?: string
  accent?: string
  heroGrad?: string
  pillBg?: string
  desc?: string
}

interface UserTemplate {
  id: string
  name: string
  type: string
  category: string
  subject?: string
  isPreset?: false
  createdAt: string
}

// ─── Static mock data for WhatsApp / Automation tabs ─────────────────────────

interface StaticTemplate {
  id: string; name: string; category: string; channel: Channel
  tags: string[]; uses: number; gradient: string; emoji: string; isPopular?: boolean
}

const WA_TEMPLATES: StaticTemplate[] = [
  { id: 'w1', name: 'Sipariş Onayı',         category: 'promo',   channel: 'whatsapp', tags: ['Sipariş', 'Bildirim'],    uses: 18400, gradient: 'linear-gradient(135deg,#f0fff4 0%,#c6f6d5 100%)', emoji: '✅', isPopular: true },
  { id: 'w2', name: 'Kargo Takip Bildirimi', category: 'promo',   channel: 'whatsapp', tags: ['Kargo', 'Bildirim'],      uses: 12600, gradient: 'linear-gradient(135deg,#f0f4ff 0%,#c3dafe 100%)', emoji: '📦' },
  { id: 'w3', name: 'Sepet Hatırlatma',      category: 'abandon', channel: 'whatsapp', tags: ['Sepet Terk', 'Dönüşüm'], uses: 9800,  gradient: 'linear-gradient(135deg,#fff8e1 0%,#ffecb3 100%)', emoji: '🛒', isPopular: true },
  { id: 'w4', name: 'Flash İndirim Uyarısı', category: 'promo',  channel: 'whatsapp', tags: ['Acil', 'İndirim'],        uses: 7200,  gradient: 'linear-gradient(135deg,#fff0f0 0%,#fecaca 100%)', emoji: '⚡' },
  { id: 'w5', name: 'Doğum Günü Mesajı',    category: 'holiday', channel: 'whatsapp', tags: ['Kişisel', 'Özel Gün'],   uses: 5600,  gradient: 'linear-gradient(135deg,#fdf0ff 0%,#e9d5ff 100%)', emoji: '🎁' },
  { id: 'w6', name: 'Müşteri Geri Kazanma', category: 'loyalty', channel: 'whatsapp', tags: ['Win-back', 'Pasif'],      uses: 3900,  gradient: 'linear-gradient(135deg,#f0fdf4 0%,#bbf7d0 100%)', emoji: '💫' },
]

const AUTO_TEMPLATES: StaticTemplate[] = [
  { id: 'a1', name: 'Hoş Geldin Serisi',     category: 'welcome', channel: 'automation', tags: ['Email', 'Yeni Üye'],  uses: 4800, gradient: 'linear-gradient(135deg,#f0f4ff 0%,#e0e8ff 100%)', emoji: '🌟', isPopular: true },
  { id: 'a2', name: 'Sepet Terk Akışı',      category: 'abandon', channel: 'automation', tags: ['Email + WA'],          uses: 6200, gradient: 'linear-gradient(135deg,#fff8f0 0%,#ffe8d0 100%)', emoji: '🛒' },
  { id: 'a3', name: 'Win-back 90 Gün',       category: 'loyalty', channel: 'automation', tags: ['Win-back', 'Pasif'],   uses: 2900, gradient: 'linear-gradient(135deg,#f5f0ff 0%,#e8d8ff 100%)', emoji: '🔄' },
  { id: 'a4', name: 'Sipariş Sonrası Akışı', category: 'promo',   channel: 'automation', tags: ['Dönüşüm', 'Upsell'],   uses: 3700, gradient: 'linear-gradient(135deg,#f0fff4 0%,#c6f6d5 100%)', emoji: '📦', isPopular: true },
  { id: 'a5', name: 'Doğum Günü Otomasyon', category: 'holiday', channel: 'automation', tags: ['Kişisel', 'Özel Gün'], uses: 2100, gradient: 'linear-gradient(135deg,#fff0f5 0%,#ffd8e8 100%)', emoji: '🎂' },
  { id: 'a6', name: 'VIP Yükseltme Akışı',  category: 'loyalty', channel: 'automation', tags: ['VIP', 'Loyalty'],      uses: 1800, gradient: 'linear-gradient(135deg,#1a0800 0%,#2d1500 100%)', emoji: '👑' },
]

const EMAIL_CATS = [
  { id: 'welcome',   label: 'Hoş Geldin',        emoji: '👋' },
  { id: 'promo',     label: 'İndirim & Kampanya', emoji: '🏷️' },
  { id: 'abandon',   label: 'Sepet Terk',         emoji: '🛒' },
  { id: 'newprod',   label: 'Yeni Ürün',          emoji: '🆕' },
  { id: 'loyalty',   label: 'Sadakat & VIP',      emoji: '👑' },
  { id: 'holiday',   label: 'Özel Günler',        emoji: '🎉' },
]

const SIDEBAR_CATS = [
  { id: 'all',       label: 'Tümü' },
  { id: 'welcome',   label: 'Hoş Geldin' },
  { id: 'promo',     label: 'İndirim & Kampanya' },
  { id: 'abandon',   label: 'Sepet Terk' },
  { id: 'newprod',   label: 'Yeni Ürün' },
  { id: 'loyalty',   label: 'Sadakat & VIP' },
  { id: 'holiday',   label: 'Özel Günler' },
  { id: 'news',      label: 'Haber Bülteni' },
  { id: 'other',     label: 'Diğer' },
]

const ACCENT_MAP: Record<string, string> = {
  cart: '#3b82f6', vip: '#f59e0b', launch: '#8b5cf6',
  flash: '#ef4444', winback: '#10b981', welcome: '#6366f1',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const router = useRouter()
  const [activeChannel, setActiveChannel] = useState<Channel>('email')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [showMyTemplates, setShowMyTemplates] = useState(false)

  const [presets, setPresets] = useState<PresetTemplate[]>([])
  const [myTemplates, setMyTemplates] = useState<UserTemplate[]>([])
  const [loadingPresets, setLoadingPresets] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/templates')
      .then(r => r.json())
      .then(data => {
        setPresets(data.presets ?? [])
        setMyTemplates(data.userTemplates ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingPresets(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istiyor musunuz?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      setMyTemplates(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  // ── Filtered presets ──
  const filteredPresets = presets.filter(p => {
    if (activeCategory !== 'all' && !p.category?.includes(activeCategory)) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // ── Static templates for WA/Automation ──
  const staticTemplates = (activeChannel === 'whatsapp' ? WA_TEMPLATES : AUTO_TEMPLATES).filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => sortBy === 'popular' ? b.uses - a.uses : a.name.localeCompare(b.name, 'tr'))

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.96)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Şablonlar</h1>
          <p className="text-[11px]" style={{ color: '#44445a' }}>E-posta ve WhatsApp şablonlarını keşfedin veya kendi şablonunuzu oluşturun.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMyTemplates(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
            style={showMyTemplates
              ? { background: 'rgba(68,112,255,0.15)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.3)' }
              : { background: 'rgba(255,255,255,0.05)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FileText className="w-3.5 h-3.5" />
            Kendi Şablonlarım
            {myTemplates.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                style={{ background: showMyTemplates ? 'rgba(68,112,255,0.3)' : 'rgba(255,255,255,0.08)', color: showMyTemplates ? '#99b4ff' : '#8080a0' }}>
                {myTemplates.length}
              </span>
            )}
          </button>
          <Link href="/templates/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> Yeni Şablon
          </Link>
        </div>
      </div>

      {/* ── My Templates panel ── */}
      {showMyTemplates && (
        <div className="shrink-0 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(68,112,255,0.03)' }}>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#4470ff' }}>Kendi Şablonlarım</p>
          {myTemplates.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <FileText className="w-4 h-4" style={{ color: '#33334a' }} />
              </div>
              <div>
                <p className="text-[12px] font-medium" style={{ color: '#8080a0' }}>Henüz şablon oluşturmadınız</p>
                <p className="text-[11px]" style={{ color: '#33334a' }}>Yukarıdaki "Yeni Şablon" butonuyla başlayın</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {myTemplates.map(t => (
                <div key={t.id} className="rounded-xl p-3 group"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(68,112,255,0.1)' }}>
                      <Mail className="w-3.5 h-3.5" style={{ color: '#4470ff' }} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/templates/new?id=${t.id}`}
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.08)', color: '#8080a0' }}>
                        <Edit3 className="w-3 h-3" />
                      </Link>
                      <button onClick={() => handleDelete(t.id)} disabled={deletingId === t.id}
                        className="w-6 h-6 rounded-md flex items-center justify-center"
                        style={{ background: 'rgba(232,69,69,0.1)', color: '#e84545' }}>
                        {deletingId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold mb-0.5 truncate" style={{ color: '#eeeef4' }}>{t.name}</p>
                  {t.subject && <p className="text-[10px] truncate" style={{ color: '#44445a' }}>{t.subject}</p>}
                  <p className="text-[10px] mt-1" style={{ color: '#33334a' }}>
                    {new Date(t.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Channel tabs ── */}
      <div className="px-6 flex items-center shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.08)' }}>
        {([
          { key: 'email', label: 'E-posta Şablonları', icon: Mail },
          { key: 'whatsapp', label: 'WhatsApp Şablonları', icon: MessageSquare },
          { key: 'automation', label: 'Otomasyon Şablonları', icon: Zap },
        ] as const).map(tab => {
          const Icon = tab.icon
          const active = activeChannel === tab.key
          return (
            <button key={tab.key} onClick={() => { setActiveChannel(tab.key); setActiveCategory('all') }}
              className="flex items-center gap-2 px-5 py-3 text-[12px] font-semibold relative"
              style={{ color: active ? '#eeeef4' : '#44445a' }}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#4470ff' }} />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Search + filters */}
          <div className="px-6 py-4 space-y-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#44445a' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Şablon ara..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-[12px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')} />
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl text-[11px] outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                <option value="popular">En Popüler</option>
                <option value="alpha">A-Z</option>
              </select>
            </div>

            {activeChannel === 'email' && (
              <div className="flex items-center gap-2 flex-wrap">
                {EMAIL_CATS.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                    style={activeCategory === cat.id
                      ? { background: 'rgba(68,112,255,0.15)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.3)' }
                      : { background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Template grid */}
          <div className="flex-1 overflow-auto px-6 pb-8">
            {activeChannel === 'email' ? (
              loadingPresets ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#4470ff' }} />
                </div>
              ) : filteredPresets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px]" style={{ background: 'rgba(255,255,255,0.04)' }}>📭</div>
                  <p className="text-[13px] font-semibold" style={{ color: '#44445a' }}>Şablon bulunamadı</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-4" style={{ color: '#33334a' }}>Hazır E-posta Şablonları — {filteredPresets.length} şablon</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPresets.map(tpl => {
                      const presetKey = tpl.id.replace('preset:', '')
                      const accent = ACCENT_MAP[presetKey] || '#4470ff'
                      return (
                        <div key={tpl.id} className="rounded-2xl overflow-hidden group cursor-pointer transition-all"
                          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

                          {/* Preview area */}
                          <div className="relative h-36 flex items-center justify-center overflow-hidden"
                            style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>
                              {presetKey === 'cart' ? '🛒' : presetKey === 'vip' ? '👑' : presetKey === 'launch' ? '✨' : presetKey === 'flash' ? '⚡' : presetKey === 'winback' ? '💚' : '📧'}
                            </div>

                            {/* Hover overlay */}
                            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                              <Link href={`/templates/new?preset=${presetKey}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                                <Eye className="w-3 h-3" /> Önizle
                              </Link>
                              <Link href={`/templates/new?preset=${presetKey}`}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                                style={{ background: accent, color: '#fff' }}>
                                <Plus className="w-3 h-3" /> Kullan
                              </Link>
                            </div>

                            {tpl.tag && (
                              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
                                style={{ background: `${accent}cc`, color: '#fff' }}>
                                {tpl.tag}
                              </div>
                            )}
                          </div>

                          <div className="p-3.5">
                            <p className="text-[12px] font-semibold mb-1" style={{ color: '#eeeef4' }}>{tpl.name}</p>
                            {tpl.desc && <p className="text-[10px] mb-2" style={{ color: '#44445a' }}>{tpl.desc}</p>}
                            <div className="flex items-center justify-between">
                              {tpl.rate && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                                  style={{ background: `${accent}15`, color: accent }}>
                                  {tpl.rate}
                                </span>
                              )}
                              <Link href={`/templates/new?preset=${presetKey}`}
                                className="flex items-center justify-center w-6 h-6 rounded-lg ml-auto transition-all"
                                style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
                                <Plus className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            ) : (
              // WhatsApp / Automation — static templates
              staticTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px]" style={{ background: 'rgba(255,255,255,0.04)' }}>📭</div>
                  <p className="text-[13px] font-semibold" style={{ color: '#44445a' }}>Şablon bulunamadı</p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] mb-4" style={{ color: '#33334a' }}>
                    {activeChannel === 'whatsapp' ? 'WhatsApp' : 'Otomasyon'} Şablonları — {staticTemplates.length} şablon
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {staticTemplates.map(tpl => (
                      <div key={tpl.id} className="rounded-2xl overflow-hidden group cursor-pointer transition-all"
                        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.35)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

                        <div className="relative h-36 flex items-center justify-center overflow-hidden"
                          style={{ background: tpl.gradient }}>
                          <span style={{ fontSize: '48px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>{tpl.emoji}</span>
                          <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                              <Eye className="w-3 h-3" /> Önizle
                            </button>
                          </div>
                          {tpl.isPopular && (
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
                              style={{ background: 'rgba(159,122,250,0.9)', color: '#fff' }}>
                              Popüler
                            </div>
                          )}
                        </div>

                        <div className="p-3.5">
                          <p className="text-[12px] font-semibold mb-1.5" style={{ color: '#eeeef4' }}>{tpl.name}</p>
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {tpl.tags.map(tag => (
                              <span key={tag} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                                style={{ background: 'rgba(255,255,255,0.05)', color: '#44445a' }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px]" style={{ color: '#33334a' }}>
                              <Eye className="w-2.5 h-2.5" />
                              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatNumber(tpl.uses)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-52 shrink-0 flex flex-col overflow-y-auto"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.1)' }}>
          <div className="p-4 space-y-6">

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#44445a' }}>Kategoriler</p>
              <div className="space-y-0.5">
                {SIDEBAR_CATS.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className="flex items-center w-full px-2 py-1.5 rounded-lg text-left transition-all"
                    style={activeCategory === cat.id ? { background: 'rgba(68,112,255,0.12)', color: '#99b4ff' } : { color: '#8080a0' }}
                    onMouseEnter={e => { if (activeCategory !== cat.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (activeCategory !== cat.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <span className="text-[11px] font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#44445a' }}>Kanal</p>
              <div className="space-y-1.5">
                {([
                  { key: 'email', label: 'E-posta', icon: Mail },
                  { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { key: 'automation', label: 'Otomasyon', icon: Zap },
                ] as const).map(ch => {
                  const Icon = ch.icon
                  const isActive = activeChannel === ch.key
                  return (
                    <button key={ch.key} onClick={() => { setActiveChannel(ch.key); setActiveCategory('all') }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg"
                      style={isActive ? { color: '#99b4ff' } : { color: '#8080a0' }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center border shrink-0"
                        style={{ borderColor: isActive ? '#99b4ff' : 'rgba(255,255,255,0.1)', background: isActive ? 'rgba(153,180,255,0.1)' : 'transparent' }}>
                        {isActive && <Check className="w-2.5 h-2.5" style={{ color: '#99b4ff' }} />}
                      </div>
                      <span className="text-[11px] font-medium">{ch.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* CTA */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <p className="text-[11px] font-bold mb-1" style={{ color: '#eeeef4' }}>Kendi şablonunu oluştur</p>
              <p className="text-[10px] mb-2.5" style={{ color: '#8080a0' }}>Sıfırdan e-posta şablonu tasarla</p>
              <Link href="/templates/new" className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#99b4ff' }}>
                <Plus className="w-3 h-3" /> Başla
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
