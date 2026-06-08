'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Search, Sparkles, ArrowLeft, Crown, ShoppingCart, Gift,
  Flame, UserPlus, Zap, Star, Package, Plus, Edit3,
  Trash2, Loader2, LayoutTemplate, BookOpen, Lock,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import { templatePresets } from '@/lib/email-template-presets'

/* ─── Types ─────────────────────────────────── */

interface UserTemplate {
  id: string
  name: string
  type: string
  category: string
  subject?: string
  body: string
  design: string
  createdAt: string
}

/* ─── Category config ────────────────────────── */

const categories = [
  { id: 'all', label: 'Tümü', icon: LayoutTemplate },
  { id: 'cart', label: 'Sepet Terk', icon: ShoppingCart },
  { id: 'vip', label: 'VIP', icon: Crown },
  { id: 'promo', label: 'İndirim', icon: Star },
  { id: 'launch', label: 'Lansman', icon: Zap },
  { id: 'winback', label: 'Win-Back', icon: Flame },
  { id: 'birthday', label: 'Doğum Günü', icon: Gift },
  { id: 'welcome', label: 'Hoş Geldin', icon: UserPlus },
  { id: 'restock', label: 'Stok', icon: Package },
]

/* ─── Template Image Thumbnail ───────────────── */

function TemplateThumbnail({ imageUrl, gradient, accent }: { imageUrl?: string; gradient: string; accent: string }) {
  const [imgError, setImgError] = useState(false)

  if (imageUrl && !imgError) {
    return (
      <Image
        src={imageUrl}
        alt="template preview"
        fill
        className="object-cover object-top"
        onError={() => setImgError(true)}
        sizes="(max-width: 768px) 50vw, 25vw"
      />
    )
  }

  return (
    <div className={cn('absolute inset-0 bg-gradient-to-br', gradient, 'flex flex-col items-center justify-center gap-3 p-4')}>
      <div className="w-full max-w-[120px] space-y-1.5 opacity-60">
        <div className="h-2 rounded-full" style={{ backgroundColor: accent, width: '70%' }} />
        <div className="h-1.5 bg-white/20 rounded-full w-full" />
        <div className="h-1.5 bg-white/20 rounded-full" style={{ width: '85%' }} />
        <div className="h-1.5 bg-white/20 rounded-full" style={{ width: '60%' }} />
        <div className="mt-2 h-6 rounded-lg" style={{ backgroundColor: accent, opacity: 0.8 }} />
      </div>
    </div>
  )
}

/* ─── Preset Template Card ───────────────────── */

function PresetCard({ preset, isPremiumUser }: { preset: typeof templatePresets[0]; isPremiumUser: boolean }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const locked = preset.isPremium && !isPremiumUser

  function handleClick() {
    if (locked) return
    router.push(`/campaigns/editor?template=${preset.id}`)
  }

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-[#0d0d12] overflow-hidden transition-all duration-300',
        locked
          ? 'border-amber-500/20 cursor-default'
          : 'border-white/[0.06] hover:border-white/[0.14] cursor-pointer hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ height: '220px' }}>
        <TemplateThumbnail imageUrl={preset.imageUrl} gradient={preset.heroGrad} accent={preset.accent} />

        {/* Premium lock overlay */}
        {locked && (
          <div className="absolute inset-0 bg-[#08080f]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-center px-4">
              <p className="text-xs font-bold text-amber-400">Premium Şablon</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Planını yükselt</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); router.push('/plans') }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-[11px] font-bold rounded-xl transition-all">
              <Crown className="w-3 h-3" />
              Upgrade
            </button>
          </div>
        )}

        {/* Hover overlay (free templates) */}
        {!locked && (
          <div className={cn(
            'absolute inset-0 bg-[#060609]/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 transition-all duration-200',
            hovered ? 'opacity-100' : 'opacity-0'
          )}>
            <button
              onClick={e => { e.stopPropagation(); router.push(`/campaigns/editor?template=${preset.id}`) }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30">
              <Edit3 className="w-4 h-4" />
              Bu Şablonu Kullan
            </button>
            <button
              onClick={e => { e.stopPropagation(); router.push('/ai-studio') }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-all border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              AI ile Özelleştir
            </button>
          </div>
        )}

        {/* Premium badge (top-right) */}
        {preset.isPremium && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-lg">
            <Crown className="w-2.5 h-2.5 text-amber-400" />
            <span className="text-[9px] font-bold text-amber-400">PRO</span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className={cn('p-4', locked && 'opacity-60')}>
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-white">{preset.name}</h3>
          <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', preset.pillBg)}>
            {preset.rate}
          </span>
        </div>
        <p className="text-[11px] text-gray-600 mb-3">{preset.desc}</p>
        <div className="flex items-center justify-between">
          <span className={cn('text-[10px] font-bold', preset.tagColor)}>{preset.tag}</span>
          <div className="flex items-center gap-1 text-[10px] text-gray-700">
            <Sparkles className="w-3 h-3" />
            AI Optimize
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── User Template Card ─────────────────────── */

function UserTemplateCard({ template, onDelete }: { template: UserTemplate; onDelete: (id: string) => void }) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    await fetch(`/api/templates/${template.id}`, { method: 'DELETE' })
    onDelete(template.id)
  }

  return (
    <div
      className="group relative rounded-2xl border border-white/[0.06] bg-[#0d0d12] overflow-hidden hover:border-white/[0.14] transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-black/40 hover:-translate-y-0.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/campaigns/editor?userTemplate=${template.id}`)}
    >
      <div className="relative overflow-hidden bg-[#0a0a10]" style={{ height: '220px' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
          <div className="w-full max-w-[120px] space-y-1.5 opacity-40">
            <div className="h-2 bg-violet-500 rounded-full" style={{ width: '70%' }} />
            <div className="h-1.5 bg-white/20 rounded-full w-full" />
            <div className="h-1.5 bg-white/20 rounded-full" style={{ width: '85%' }} />
            <div className="h-1.5 bg-white/20 rounded-full" style={{ width: '60%' }} />
            <div className="mt-2 h-6 bg-violet-500/80 rounded-lg" />
          </div>
        </div>

        <div className={cn(
          'absolute inset-0 bg-[#060609]/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 transition-all duration-200',
          hovered ? 'opacity-100' : 'opacity-0'
        )}>
          <button
            onClick={e => { e.stopPropagation(); router.push(`/campaigns/editor?userTemplate=${template.id}`) }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30">
            <Edit3 className="w-4 h-4" />
            Düzenle
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold rounded-xl transition-all border border-red-500/20">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {confirmDel ? 'Emin misiniz?' : 'Sil'}
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-bold text-white truncate flex-1">{template.name}</h3>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 ml-2 shrink-0">Şablonum</span>
        </div>
        {template.subject && <p className="text-[11px] text-gray-600 truncate">{template.subject}</p>}
      </div>
    </div>
  )
}

/* ─── Blank Starter Card ─────────────────────── */

function BlankCard() {
  return (
    <Link href="/campaigns/editor"
      className="group relative rounded-2xl border-2 border-dashed border-white/[0.06] bg-transparent overflow-hidden hover:border-blue-500/30 hover:bg-blue-500/[0.03] transition-all duration-300 cursor-pointer min-h-[310px] flex flex-col items-center justify-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] group-hover:bg-blue-500/10 border border-white/[0.06] group-hover:border-blue-500/30 flex items-center justify-center transition-all">
        <Plus className="w-7 h-7 text-gray-600 group-hover:text-blue-400 transition-colors" />
      </div>
      <div className="text-center px-6">
        <p className="text-sm font-bold text-gray-500 group-hover:text-gray-200 transition-colors">Boş Şablon</p>
        <p className="text-xs text-gray-700 mt-1">Sıfırdan oluştur</p>
      </div>
    </Link>
  )
}

/* ─── MAIN PAGE ───────────────────────────────── */

export default function TemplatesPage() {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [tab, setTab] = useState<'presets' | 'mine'>('presets')
  const [isPremiumUser, setIsPremiumUser] = useState(false)

  useEffect(() => {
    fetch('/api/templates?presets=false')
      .then(r => r.json())
      .then(data => {
        if (data.userTemplates) setUserTemplates(data.userTemplates)
        if (data.isPremium) setIsPremiumUser(true)
      })
      .catch(() => {})
      .finally(() => setLoadingUser(false))
  }, [])

  function handleDeleteTemplate(id: string) {
    setUserTemplates(prev => prev.filter(t => t.id !== id))
  }

  const filteredPresets = useMemo(() => {
    return templatePresets.filter(t => {
      const matchCategory = activeCategory === 'all' || t.category === activeCategory
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [activeCategory, search])

  const filteredUser = useMemo(() => {
    return userTemplates.filter(t =>
      !search || t.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [userTemplates, search])

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="border-b border-white/[0.05] bg-[#08080f]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="px-6 py-4 flex items-center gap-4">
          <Link href="/campaigns" className="flex items-center gap-1.5 text-gray-600 hover:text-gray-300 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <h1 className="text-base font-bold text-white">Template Library</h1>
            <p className="text-[11px] text-gray-600">Hazır şablon seçin, editörde özelleştirin</p>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Şablon ara..."
              className="w-52 pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] text-white placeholder:text-gray-700 rounded-xl text-xs focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <Link href="/campaigns/editor"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
            <Plus className="w-3.5 h-3.5" />
            Boş Editör
          </Link>
        </div>

        {/* Tab + Categories */}
        <div className="px-6 pb-3 flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-1 bg-white/[0.04] border border-white/[0.05] rounded-xl p-1 shrink-0">
            <button onClick={() => setTab('presets')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                tab === 'presets' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-500 hover:text-gray-300')}>
              Hazır Şablonlar
              <span className="ml-1.5 text-[9px] opacity-70">{filteredPresets.length}</span>
            </button>
            <button onClick={() => setTab('mine')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                tab === 'mine' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300')}>
              Şablonlarım
              <span className="ml-1.5 text-[9px] opacity-70">{userTemplates.length}</span>
            </button>
          </div>

          {tab === 'presets' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {categories.map(cat => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 border',
                      activeCategory === cat.id
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-400'
                        : 'bg-transparent border-white/[0.05] text-gray-600 hover:text-gray-300 hover:border-white/10'
                    )}>
                    <Icon className="w-3 h-3" />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6 bg-[#080810] min-h-full">

        {tab === 'presets' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <BlankCard />
            {filteredPresets.map(preset => (
              <PresetCard key={preset.id} preset={preset} isPremiumUser={isPremiumUser} />
            ))}
            {filteredPresets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-600" />
                </div>
                <p className="text-sm text-gray-600">"{search}" için şablon bulunamadı</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <BlankCard />
            {loadingUser ? (
              <div className="col-span-full flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredUser.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-gray-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 font-medium">Henüz şablon yok</p>
                  <p className="text-xs text-gray-700 mt-1">Editörde bir tasarım yapıp "Şablon Kaydet" ile burada görün</p>
                </div>
              </div>
            ) : filteredUser.map(t => (
              <UserTemplateCard key={t.id} template={t} onDelete={handleDeleteTemplate} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
