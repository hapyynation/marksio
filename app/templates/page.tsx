'use client'

import AppShell from '@/components/layout/AppShell'
import {
  Plus, Search, Eye, Mail, MessageSquare, Zap,
  ChevronRight, Filter, Star, Check,
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { cn, formatNumber } from '@/lib/utils'

type Channel = 'email' | 'whatsapp' | 'automation'

interface Template {
  id: string
  name: string
  category: string
  channel: Channel
  tags: string[]
  uses: number
  gradient: string
  emoji: string
  isPopular?: boolean
}

const EMAIL_CATS = [
  { id: 'welcome',   label: 'Hoş Geldin',       emoji: '👋', count: 12 },
  { id: 'promo',     label: 'İndirim & Kampanya', emoji: '🏷️', count: 28 },
  { id: 'abandon',   label: 'Sepet Terk',        emoji: '🛒', count: 15 },
  { id: 'newprod',   label: 'Yeni Ürün',         emoji: '🆕', count: 18 },
  { id: 'loyalty',   label: 'Sadakat & VIP',     emoji: '👑', count: 10 },
  { id: 'holiday',   label: 'Özel Günler',       emoji: '🎉', count: 14 },
]

const SIDEBAR_CATS = [
  { id: 'all',      label: 'Tümü',              count: 124 },
  { id: 'welcome',  label: 'Hoş Geldin',        count: 12 },
  { id: 'promo',    label: 'İndirim & Kampanya', count: 28 },
  { id: 'abandon',  label: 'Sepet Terk',        count: 15 },
  { id: 'newprod',  label: 'Yeni Ürün',         count: 18 },
  { id: 'loyalty',  label: 'Sadakat & VIP',     count: 10 },
  { id: 'holiday',  label: 'Özel Günler',       count: 14 },
  { id: 'news',     label: 'Haber Bülteni',     count: 11 },
  { id: 'other',    label: 'Diğer',             count: 16 },
]

const EMAIL_TEMPLATES: Template[] = [
  { id: 'e1', name: 'Hoş Geldin E-postası',      category: 'welcome', channel: 'email', tags: ['Hoş Geldin', 'E-ticaret'], uses: 12400, gradient: 'linear-gradient(135deg,#f0f4ff 0%,#e0e8ff 100%)', emoji: '👋', isPopular: true },
  { id: 'e2', name: 'Black Friday Kampanyası',   category: 'promo',   channel: 'email', tags: ['İndirim', 'Kampanya'],    uses: 8700,  gradient: 'linear-gradient(135deg,#0a0a0a 0%,#1a0500 100%)', emoji: '🛍️' },
  { id: 'e3', name: 'Sepet Terk Hatırlatma',     category: 'abandon', channel: 'email', tags: ['Sepet Terk', 'E-ticaret'], uses: 15200, gradient: 'linear-gradient(135deg,#fff8f0 0%,#ffe8d0 100%)', emoji: '🛒', isPopular: true },
  { id: 'e4', name: 'Yeni Ürün Koleksiyonu',     category: 'newprod', channel: 'email', tags: ['Yeni Ürün', 'Duyuru'],    uses: 6300,  gradient: 'linear-gradient(135deg,#f0f8ff 0%,#d8ecff 100%)', emoji: '✨' },
  { id: 'e5', name: 'Özel İndirim Kuponu',       category: 'promo',   channel: 'email', tags: ['İndirim', 'Kişisel'],    uses: 9200,  gradient: 'linear-gradient(135deg,#f5f0ff 0%,#e8d8ff 100%)', emoji: '🎫' },
  { id: 'e6', name: 'Doğum Günü Kutlama',        category: 'holiday', channel: 'email', tags: ['Kişisel', 'Özel Gün'],   uses: 7400,  gradient: 'linear-gradient(135deg,#fff0f5 0%,#ffd8e8 100%)', emoji: '🎂' },
  { id: 'e7', name: 'Ürün Yorum İsteği',         category: 'promo',   channel: 'email', tags: ['Geri Bildirim', 'Sosyal'], uses: 4100, gradient: 'linear-gradient(135deg,#f8fff0 0%,#d8f8c0 100%)', emoji: '⭐' },
  { id: 'e8', name: 'VIP Müşteri E-postası',     category: 'loyalty', channel: 'email', tags: ['VIP', 'Özel'],           uses: 5800,  gradient: 'linear-gradient(135deg,#1a0800 0%,#2d1500 100%)', emoji: '👑', isPopular: true },
]

const WA_TEMPLATES: Template[] = [
  { id: 'w1', name: 'Sipariş Onayı',         category: 'promo',   channel: 'whatsapp', tags: ['Sipariş', 'Bildirim'],    uses: 18400, gradient: 'linear-gradient(135deg,#f0fff4 0%,#c6f6d5 100%)', emoji: '✅', isPopular: true },
  { id: 'w2', name: 'Kargo Takip Bildirimi', category: 'promo',   channel: 'whatsapp', tags: ['Kargo', 'Bildirim'],      uses: 12600, gradient: 'linear-gradient(135deg,#f0f4ff 0%,#c3dafe 100%)', emoji: '📦' },
  { id: 'w3', name: 'Sepet Hatırlatma',      category: 'abandon', channel: 'whatsapp', tags: ['Sepet Terk', 'Dönüşüm'], uses: 9800,  gradient: 'linear-gradient(135deg,#fff8e1 0%,#ffecb3 100%)', emoji: '🛒', isPopular: true },
  { id: 'w4', name: 'Flash İndirim Uyarısı', category: 'promo',  channel: 'whatsapp', tags: ['Acil', 'İndirim'],        uses: 7200,  gradient: 'linear-gradient(135deg,#fff0f0 0%,#fecaca 100%)', emoji: '⚡' },
  { id: 'w5', name: 'Doğum Günü Mesajı',    category: 'holiday', channel: 'whatsapp', tags: ['Kişisel', 'Özel Gün'],   uses: 5600,  gradient: 'linear-gradient(135deg,#fdf0ff 0%,#e9d5ff 100%)', emoji: '🎁' },
  { id: 'w6', name: 'Müşteri Geri Kazanma', category: 'loyalty', channel: 'whatsapp', tags: ['Win-back', 'Pasif'],      uses: 3900,  gradient: 'linear-gradient(135deg,#f0fdf4 0%,#bbf7d0 100%)', emoji: '💫' },
]


const AUTO_TEMPLATES: Template[] = [
  { id: 'a1', name: 'Hoş Geldin Serisi',         category: 'welcome', channel: 'automation', tags: ['Email', 'Yeni Üye'],  uses: 4800, gradient: 'linear-gradient(135deg,#f0f4ff 0%,#e0e8ff 100%)', emoji: '🌟', isPopular: true },
  { id: 'a2', name: 'Sepet Terk Akışı',          category: 'abandon', channel: 'automation', tags: ['Email + WA'],          uses: 6200, gradient: 'linear-gradient(135deg,#fff8f0 0%,#ffe8d0 100%)', emoji: '🛒' },
  { id: 'a3', name: 'Win-back 90 Gün',           category: 'loyalty', channel: 'automation', tags: ['Win-back', 'Pasif'],   uses: 2900, gradient: 'linear-gradient(135deg,#f5f0ff 0%,#e8d8ff 100%)', emoji: '🔄' },
  { id: 'a4', name: 'Sipariş Sonrası Akışı',     category: 'promo',   channel: 'automation', tags: ['Dönüşüm', 'Upsell'],   uses: 3700, gradient: 'linear-gradient(135deg,#f0fff4 0%,#c6f6d5 100%)', emoji: '📦', isPopular: true },
  { id: 'a5', name: 'Doğum Günü Otomasyon',      category: 'holiday', channel: 'automation', tags: ['Kişisel', 'Özel Gün'], uses: 2100, gradient: 'linear-gradient(135deg,#fff0f5 0%,#ffd8e8 100%)', emoji: '🎂' },
  { id: 'a6', name: 'VIP Yükseltme Akışı',       category: 'loyalty', channel: 'automation', tags: ['VIP', 'Loyalty'],      uses: 1800, gradient: 'linear-gradient(135deg,#1a0800 0%,#2d1500 100%)', emoji: '👑' },
]

const CHANNEL_TABS: Array<{ key: Channel; label: string; icon: React.ElementType; templates: Template[] }> = [
  { key: 'email',      label: 'E-posta Şablonları',   icon: Mail,          templates: EMAIL_TEMPLATES },
  { key: 'whatsapp',   label: 'WhatsApp Şablonları',  icon: MessageSquare, templates: WA_TEMPLATES    },
  { key: 'automation', label: 'Otomasyon Şablonları', icon: Zap,           templates: AUTO_TEMPLATES   },
]

export default function TemplatesPage() {
  const [activeChannel, setActiveChannel] = useState<Channel>('email')
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [langFilter, setLangFilter] = useState('all')

  const currentTab = CHANNEL_TABS.find(t => t.key === activeChannel)!
  const allTemplates = currentTab.templates

  const filtered = allTemplates.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'popular') return b.uses - a.uses
    return a.name.localeCompare(b.name, 'tr')
  })

  return (
    <AppShell>
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(9,9,15,0.95)', backdropFilter: 'blur(24px)' }}>
        <div>
          <h1 className="text-[16px] font-bold" style={{ color: '#eeeef4' }}>Şablonlar</h1>
          <p className="text-[11px]" style={{ color: '#44445a' }}>E-posta ve WhatsApp şablonlarını keşfedin ve kampanyalarınızda kullanın.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.08)' }}>
            Kendi Şablonlarım
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold"
            style={{ background: '#4470ff', color: '#fff' }}>
            <Plus className="w-3.5 h-3.5" /> Yeni Şablon Oluştur
          </button>
        </div>
      </div>

      {/* ── Channel tabs ── */}
      <div className="px-6 flex items-center gap-0 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.1)' }}>
        {CHANNEL_TABS.map(tab => {
          const TabIcon = tab.icon
          const active = activeChannel === tab.key
          return (
            <button key={tab.key} onClick={() => { setActiveChannel(tab.key); setActiveCategory('all') }}
              className="flex items-center gap-2 px-5 py-3 text-[12px] font-semibold transition-all relative"
              style={{ color: active ? '#eeeef4' : '#44445a' }}>
              <TabIcon className="w-3.5 h-3.5" />
              {tab.label}
              {active && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#4470ff' }} />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── Search + filter + popular categories ── */}
          <div className="px-6 py-4 space-y-4 shrink-0">
            {/* Search + filter bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#44445a' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Şablon ara..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-[12px] outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#eeeef4' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')} />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                Tümü
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                Tüm Kategoriler
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                <Filter className="w-3 h-3" /> Filtrele
              </button>
            </div>

            {/* Popular category chips */}
            {activeChannel === 'email' && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#33334a' }}>Popüler Kategoriler</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {EMAIL_CATS.map(cat => (
                    <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? 'all' : cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                      style={activeCategory === cat.id
                        ? { background: 'rgba(68,112,255,0.15)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.3)' }
                        : { background: 'rgba(255,255,255,0.04)', color: '#8080a0', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {cat.emoji} {cat.label}
                      <span className="text-[10px] px-1 py-0.5 rounded-md"
                        style={{ background: 'rgba(255,255,255,0.06)', color: '#44445a' }}>{cat.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Template grid ── */}
          <div className="flex-1 overflow-auto px-6 pb-8">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[20px]" style={{ background: 'rgba(255,255,255,0.04)' }}>📭</div>
                <p className="text-[13px] font-semibold" style={{ color: '#44445a' }}>Şablon bulunamadı</p>
              </div>
            ) : (
              <>
                <p className="text-[11px] mb-4" style={{ color: '#33334a' }}>Öne Çıkan Şablonlar</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sorted.map(tpl => (
                    <div key={tpl.id} className="rounded-2xl overflow-hidden group cursor-pointer transition-all"
                      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(0,0,0,0.4)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>

                      {/* Preview area */}
                      <div className="relative h-36 flex items-center justify-center overflow-hidden"
                        style={{ background: tpl.gradient }}>
                        <span className="text-[48px] select-none" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }}>{tpl.emoji}</span>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background: 'rgba(0,0,0,0.5)' }}>
                          <Link href={`/campaigns/new?template=${tpl.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold"
                            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}>
                            <Eye className="w-3 h-3" /> Önizle
                          </Link>
                          <Link href={`/campaigns/new?template=${tpl.id}`}
                            className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: '#4470ff', color: '#fff' }}>
                            <Plus className="w-4 h-4" />
                          </Link>
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
                            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatNumber(tpl.uses)} kullanıldı</span>
                          </div>
                          <Link href={`/campaigns/new?template=${tpl.id}`}
                            className="flex items-center justify-center w-6 h-6 rounded-lg transition-all"
                            style={{ background: 'rgba(68,112,255,0.1)', color: '#99b4ff', border: '1px solid rgba(68,112,255,0.2)' }}>
                            <Plus className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-52 shrink-0 flex flex-col overflow-y-auto"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.1)' }}>
          <div className="p-4 space-y-6">

            {/* Kategoriler */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#44445a' }}>Kategoriler</p>
              <div className="space-y-0.5">
                {SIDEBAR_CATS.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-left transition-all"
                    style={activeCategory === cat.id
                      ? { background: 'rgba(68,112,255,0.12)', color: '#99b4ff' }
                      : { color: '#8080a0' }}
                    onMouseEnter={e => { if (activeCategory !== cat.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (activeCategory !== cat.id) e.currentTarget.style.background = 'transparent' }}>
                    <span className="text-[11px] font-medium">{cat.label}</span>
                    <span className="text-[10px]" style={{ color: '#33334a', fontFamily: 'JetBrains Mono, monospace' }}>{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Kanal filtre */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#44445a' }}>Kanal</p>
              <div className="space-y-1.5">
                {[
                  { key: 'email',      label: 'E-posta',  icon: Mail,          count: 124 },
                  { key: 'whatsapp',   label: 'WhatsApp', icon: MessageSquare, count: 68  },
                  { key: 'automation', label: 'Otomasyon', icon: Zap,          count: 32  },
                ].map(ch => {
                  const ChIcon = ch.icon
                  const isActive = activeChannel === ch.key
                  return (
                    <button key={ch.key} onClick={() => { setActiveChannel(ch.key as Channel); setActiveCategory('all') }}
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left"
                      style={isActive ? { color: '#99b4ff' } : { color: '#8080a0' }}>
                      <div className="w-4 h-4 rounded flex items-center justify-center border shrink-0"
                        style={{ borderColor: isActive ? '#99b4ff' : 'rgba(255,255,255,0.1)', background: isActive ? 'rgba(153,180,255,0.1)' : 'transparent' }}>
                        {isActive && <Check className="w-2.5 h-2.5" style={{ color: '#99b4ff' }} />}
                      </div>
                      <span className="text-[11px] font-medium">{ch.label}</span>
                      <span className="ml-auto text-[10px]" style={{ color: '#33334a' }}>{ch.count}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dil */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#44445a' }}>Dil</p>
              <select value={langFilter} onChange={e => setLangFilter(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl text-[11px] outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                <option value="all">Tümü</option>
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
              </select>
            </div>

            {/* Sırala */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#44445a' }}>Sırala</p>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl text-[11px] outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8080a0' }}>
                <option value="popular">En Popüler</option>
                <option value="alpha">A-Z</option>
              </select>
            </div>

            {/* Custom template CTA */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(68,112,255,0.06)', border: '1px solid rgba(68,112,255,0.15)' }}>
              <p className="text-[11px] font-bold mb-1" style={{ color: '#eeeef4' }}>Kendi şablonunu oluştur</p>
              <p className="text-[10px] mb-2.5" style={{ color: '#8080a0' }}>Sıfırdan kendi şablonunu tasarlayın veya alın</p>
              <button className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#99b4ff' }}>
                Oluşturmaya Başla <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
