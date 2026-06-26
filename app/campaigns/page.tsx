'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Mail, MessageSquare, Plus, TrendingUp, Eye,
  Sparkles, Send, Loader2, Search, CheckCircle2, X,
  Trash2, BarChart2, ArrowUpRight, ArrowDownRight,
  MousePointerClick,
  Copy, FileEdit, Ban, PlayCircle,
} from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { formatCurrency, formatNumber, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type CampaignType   = 'email' | 'whatsapp'
type CampaignStatus = 'draft' | 'active' | 'scheduled' | 'completed' | 'sending' | 'failed'
type FilterTab      = 'all' | 'email' | 'whatsapp' | 'draft' | 'scheduled' | 'completed'

interface Campaign {
  id: string; name: string; type: CampaignType; status: CampaignStatus
  segment: string; subject?: string; body: string
  sent: number; opened: number; clicked: number; converted: number; revenue: number
  createdAt: string; scheduledAt?: string; isAi?: boolean
}

const statusConfig: Record<CampaignStatus, { label: string; dot: string; text: string; bg: string }> = {
  completed: { label:'Gönderildi',    dot:'var(--success)', text:'var(--success)', bg:'var(--success-soft)'  },
  active:    { label:'Aktif',         dot:'var(--primary)', text:'var(--primary)', bg:'var(--primary-soft)'  },
  scheduled: { label:'Zamanlandı',   dot:'var(--warning)', text:'var(--warning)', bg:'var(--warning-soft)'  },
  sending:   { label:'Gönderiliyor', dot:'var(--primary)', text:'var(--primary)', bg:'var(--primary-soft)'  },
  failed:    { label:'Başarısız',    dot:'var(--danger)',  text:'var(--danger)',  bg:'var(--danger-soft)'   },
  draft:     { label:'Taslak',       dot:'var(--text-3)', text:'var(--text-2)', bg:'var(--surface-2)'      },
}

const channelConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  email:    { icon: Mail,          color: 'var(--primary)', label: 'E-posta'  },
  whatsapp: { icon: MessageSquare, color: 'var(--success)', label: 'WhatsApp' },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key:'all',       label:'Tümü'       },
  { key:'email',     label:'E-posta'    },
  { key:'whatsapp',  label:'WhatsApp'   },
  { key:'draft',     label:'Taslak'     },
  { key:'scheduled', label:'Zamanlandı' },
  { key:'completed', label:'Gönderildi' },
]

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-semibold"
      style={{
        background: type === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
        border: `1px solid color-mix(in srgb, ${type === 'success' ? 'var(--success)' : 'var(--danger)'} 30%, transparent)`,
        color: type === 'success' ? 'var(--success)' : 'var(--danger)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      }}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0"/> : <X className="w-4 h-4 shrink-0"/>}
      {msg}
    </div>
  )
}

function ActionBtn({ onClick, disabled, variant, children }: { onClick: () => void; disabled?: boolean; variant?: 'default' | 'danger' | 'primary'; children: React.ReactNode }) {
  const styles = {
    default: { bg:'var(--surface-2)', border:'var(--border-2)', color:'var(--text-2)', hover:'var(--surface-3)' },
    danger:  { bg:'var(--danger-soft)', border:'color-mix(in srgb, var(--danger) 25%, transparent)', color:'var(--danger)', hover:'color-mix(in srgb, var(--danger) 14%, transparent)' },
    primary: { bg:'var(--primary-soft)', border:'color-mix(in srgb, var(--primary) 25%, transparent)', color:'var(--primary)', hover:'color-mix(in srgb, var(--primary) 14%, transparent)' },
  }
  const s = styles[variant ?? 'default']
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-40 shrink-0"
      style={{ background:s.bg, border:`1px solid ${s.border}`, color:s.color }}
      onMouseEnter={e=>(e.currentTarget.style.background=s.hover)}
      onMouseLeave={e=>(e.currentTarget.style.background=s.bg)}>
      {children}
    </button>
  )
}

export default function CampaignsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [activeTab, setActiveTab]   = useState<FilterTab>('all')
  const [sendingId, setSendingId]   = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCampaigns(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSend = async (id: string) => {
    setSendingId(id)
    try {
      const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status:'active' as CampaignStatus, sent: c.sent + (data.sent ?? 0) } : c))
        showToast(`${data.sent ?? 0} kişiye gönderildi.`)
      } else showToast(data.error ?? 'Gönderim başarısız.', 'error')
    } catch { showToast('Gönderim başarısız.', 'error') }
    finally { setSendingId(null) }
  }

  const handleClone = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/clone`, { method: 'POST' })
      const d = await res.json() as Campaign & { error?: string }
      if (res.ok) {
        setCampaigns(prev => [d, ...prev])
        showToast('Kampanya kopyalandı.')
      } else {
        showToast(d.error ?? 'Kopyalama başarısız.', 'error')
      }
    } catch {
      showToast('Kopyalama başarısız.', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) { setCampaigns(prev => prev.filter(c => c.id !== id)); showToast('Kampanya silindi.') }
      else showToast('Silme başarısız.', 'error')
    } catch { showToast('Silme başarısız.', 'error') }
    finally { setDeletingId(null) }
  }

  const filtered = campaigns.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    if (activeTab === 'email')     return c.type === 'email'
    if (activeTab === 'whatsapp')  return c.type === 'whatsapp'
    if (activeTab === 'draft')     return c.status === 'draft'
    if (activeTab === 'scheduled') return c.status === 'scheduled'
    if (activeTab === 'completed') return c.status === 'completed'
    return true
  })

  const totalSent    = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalOpened  = campaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked = campaigns.reduce((s, c) => s + c.clicked, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const openRate  = totalSent > 0 ? ((totalOpened  / totalSent) * 100).toFixed(1) : '0'
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0'

  const nowDate          = new Date()
  const startOfThisMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
  const startOfLastMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1)
  const thisMonthC = campaigns.filter(c => new Date(c.createdAt) >= startOfThisMonth)
  const lastMonthC = campaigns.filter(c => { const d = new Date(c.createdAt); return d >= startOfLastMonth && d < startOfThisMonth })
  const thisMSent    = thisMonthC.reduce((s, c) => s + c.sent, 0)
  const lastMSent    = lastMonthC.reduce((s, c) => s + c.sent, 0)
  const thisMOpened  = thisMonthC.reduce((s, c) => s + c.opened, 0)
  const lastMOpened  = lastMonthC.reduce((s, c) => s + c.opened, 0)
  const thisMClicked = thisMonthC.reduce((s, c) => s + c.clicked, 0)
  const lastMClicked = lastMonthC.reduce((s, c) => s + c.clicked, 0)
  const thisMRev     = thisMonthC.reduce((s, c) => s + c.revenue, 0)
  const lastMRev     = lastMonthC.reduce((s, c) => s + c.revenue, 0)

  function momPct(curr: number, prev: number): number | null {
    if (prev === 0) return null
    return +((curr - prev) / prev * 100).toFixed(1)
  }
  function momRatePP(cSent: number, cVal: number, pSent: number, pVal: number): number | null {
    if (pSent === 0) return null
    const cRate = cSent > 0 ? cVal / cSent * 100 : 0
    const pRate = pVal / pSent * 100
    return +(cRate - pRate).toFixed(1)
  }

  const kpiChanges = {
    campaigns: momPct(thisMonthC.length, lastMonthC.length),
    sent:      momPct(thisMSent,  lastMSent),
    openRate:  momRatePP(thisMSent, thisMOpened,  lastMSent, lastMOpened),
    clickRate: momRatePP(thisMSent, thisMClicked, lastMSent, lastMClicked),
    revenue:   momPct(thisMRev, lastMRev),
  }

  return (
    <AppShell>
      {toast && <Toast msg={toast.msg} type={toast.type}/>}

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 shrink-0"
        style={{ borderBottom:'1px solid var(--border)', background:'var(--surface)' }}>
        <div>
          <h1 style={{ fontSize:15, fontWeight:600, color:'var(--text-1)' }}>Kampanyalar</h1>
          <p className="hidden sm:block" style={{ fontSize:11, color:'var(--text-2)' }}>E-posta ve WhatsApp kampanyalarınızı oluşturun, yönetin ve analiz edin.</p>
        </div>
        <Link href="/campaigns/new" className="btn-primary flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5"/> Yeni Kampanya
        </Link>
      </div>

      {/* Mobile FAB */}
      <Link href="/campaigns/new"
        className="fixed bottom-6 right-4 z-30 md:hidden w-14 h-14 flex items-center justify-center rounded-full shadow-lg"
        style={{ background:'#2563EB' }}>
        <Plus className="w-6 h-6 text-white"/>
      </Link>

      <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── KPI cards ── */}
          <div className="px-4 md:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 shrink-0">
            {[
              { label:'Toplam Kampanya', value:String(campaigns.length),      icon:BarChart2,         color:'var(--primary)', bg:'var(--primary-soft)', change:kpiChanges.campaigns },
              { label:'Gönderilen',     value:formatNumber(totalSent),        icon:Send,              color:'var(--primary)', bg:'var(--primary-soft)', change:kpiChanges.sent      },
              { label:'Açılma Oranı',   value:`%${openRate}`,                 icon:Eye,               color:'var(--success)', bg:'var(--success-soft)', change:kpiChanges.openRate  },
              { label:'Tıklama Oranı',  value:`%${clickRate}`,                icon:MousePointerClick, color:'var(--violet)',  bg:'var(--violet-soft)',  change:kpiChanges.clickRate },
              { label:'Gelir',          value:formatCurrency(totalRevenue),   icon:TrendingUp,        color:'var(--success)', bg:'var(--success-soft)', change:kpiChanges.revenue   },
            ].map(kpi => {
              const Icon      = kpi.icon
              const hasChange = kpi.change !== null
              const positive  = hasChange && kpi.change! >= 0
              return (
                <div key={kpi.label} className="rounded-2xl p-4"
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{kpi.label}</p>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:kpi.bg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color:kpi.color }}/>
                    </div>
                  </div>
                  <p style={{ fontSize:22, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.02em', marginBottom:8, lineHeight:1 }}>{kpi.value}</p>
                  {hasChange ? (
                    <div className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md')}
                      style={{ color:positive ? 'var(--success)':'var(--danger)', background:positive ? 'var(--success-soft)':'var(--danger-soft)' }}>
                      {positive ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                      %{Math.abs(kpi.change!)} geçen 30 güne göre
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ color:'var(--text-3)', background:'var(--surface-2)' }}>
                      — geçen ay verisi yok
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Filter bar ── */}
          <div className="px-4 md:px-6 py-2 flex items-center gap-3 shrink-0 overflow-x-auto no-scrollbar"
            style={{ borderBottom:'1px solid var(--border)', borderTop:'1px solid var(--border)', background:'var(--bg)' }}>
            <div className="flex items-center p-0.5 gap-0.5 rounded-xl shrink-0"
              style={{ background:'var(--surface-2)', border:'1px solid var(--border)' }}>
              {FILTER_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                  style={activeTab===tab.key ? {background:'var(--surface)',color:'var(--text-1)',boxShadow:'0 1px 2px rgba(0,0,0,0.06)'} : {color:'var(--text-2)'}}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color:'var(--text-3)' }}/>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Kampanya ara..."
                className="pl-8 pr-3 py-1.5 rounded-xl outline-none w-40 md:w-52"
                style={{ background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-1)', fontSize:12 }}/>
            </div>

            <span className="ml-auto text-[11px] shrink-0" style={{ color:'var(--text-3)' }}>
              {filtered.length} kampanya
            </span>
          </div>

          {/* ── Campaign list ── */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 space-y-2.5 max-w-5xl">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background:'var(--surface)', border:'1px solid var(--border)' }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl" style={{ background:'var(--surface-2)' }}/>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 rounded-md w-48" style={{ background:'var(--surface-2)' }}/>
                        <div className="h-2.5 rounded-md w-64" style={{ background:'var(--surface-2)' }}/>
                      </div>
                      <div className="h-6 w-20 rounded-full" style={{ background:'#F3F4F6' }}/>
                    </div>
                    <div className="h-2.5 rounded-md w-3/4" style={{ background:'var(--bg)' }}/>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-20 text-center">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{ background:'var(--primary-lighter)', border:'1.5px dashed color-mix(in srgb, var(--primary) 35%, transparent)' }}>
                    <Send className="w-6 h-6" style={{ color:'var(--primary)' }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:700, color:'var(--text-1)', marginBottom:4 }}>
                      {search || activeTab !== 'all' ? 'Filtreyle eşleşen kampanya bulunamadı' : 'Henüz kampanya oluşturmadınız'}
                    </p>
                    <p style={{ fontSize:12, color:'var(--text-2)' }}>
                      {search || activeTab !== 'all' ? 'Filtreleri temizleyerek tüm kampanyaları görün' : 'AI destekli ilk kampanyanızı oluşturmak için başlayın'}
                    </p>
                  </div>
                  {!search && activeTab === 'all' && (
                    <Link href="/campaigns/new" className="btn-primary flex items-center gap-1.5">
                      <Plus className="w-4 h-4"/> Yeni Kampanya
                    </Link>
                  )}
                </div>
              ) : filtered.map(campaign => {
                const ch     = channelConfig[campaign.type] ?? channelConfig.email
                const sc     = statusConfig[campaign.status] ?? statusConfig.draft
                const ChIcon = ch.icon
                const openR  = campaign.sent > 0 ? (campaign.opened  / campaign.sent * 100) : 0
                const clickR = campaign.sent > 0 ? (campaign.clicked / campaign.sent * 100) : 0
                const dateStr = campaign.status === 'scheduled' && campaign.scheduledAt
                  ? new Date(campaign.scheduledAt).toLocaleString('tr-TR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
                  : new Date(campaign.createdAt).toLocaleDateString('tr-TR', { day:'numeric', month:'short', year:'numeric' })

                return (
                  <div key={campaign.id} className="rounded-2xl p-4 transition-all"
                    style={{ background:'var(--surface)', border:'1px solid var(--border)', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor='color-mix(in srgb, var(--primary) 30%, var(--border))')}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)')}>

                    {/* Row 1: icon + name + status + date */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background:`${ch.color}12`, border:`1px solid ${ch.color}20` }}>
                        <ChIcon className="w-4 h-4" style={{ color:ch.color }}/>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => router.push(`/campaigns/${campaign.id}`)}
                            className="text-[13px] font-semibold truncate text-left hover:underline"
                            style={{ color:'var(--text-1)', maxWidth:280 }}>
                            {campaign.name}
                          </button>
                          {campaign.isAi && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold shrink-0"
                              style={{ background:'var(--violet-soft)', color:'var(--violet)', border:'1px solid color-mix(in srgb, var(--violet) 25%, transparent)' }}>
                              <Sparkles className="w-2.5 h-2.5"/> AI
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{ background:sc.bg, color:sc.text, border:`1px solid ${sc.text}25` }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background:sc.dot, display:'inline-block' }}/>
                          {sc.label}
                        </div>
                        <span className="hidden sm:block" style={{ fontSize:11, color:'var(--text-3)' }}>{dateStr}</span>
                      </div>
                    </div>

                    {/* Row 2: preview */}
                    <p className="text-[12px] mb-3 truncate pl-12" style={{ color:'var(--text-3)' }}>
                      {campaign.type === 'email'
                        ? `konu: ${campaign.subject ?? '(konu yok)'}`
                        : `mesaj: ${campaign.body?.slice(0, 80) ?? ''}${(campaign.body?.length ?? 0) > 80 ? '…' : ''}`}
                    </p>

                    {/* Row 3: stats + actions */}
                    <div className="flex items-center justify-between gap-3 pl-12">
                      <div className="flex items-center gap-3 flex-wrap">
                        {campaign.sent > 0 ? (
                          <>
                            <span style={{ fontSize:11, color:'var(--text-2)' }}>{formatNumber(campaign.sent)} gönderildi</span>
                            <span style={{ fontSize:11, color:'var(--text-2)' }}>{formatNumber(campaign.opened)} açıldı ({openR.toFixed(0)}%)</span>
                            {campaign.clicked > 0 && (
                              <span style={{ fontSize:11, color:'var(--text-2)' }}>{formatNumber(campaign.clicked)} tıklandı ({clickR.toFixed(0)}%)</span>
                            )}
                            {campaign.revenue > 0 && (
                              <span style={{ fontSize:11, fontWeight:700, color:'var(--success)' }}>{formatCurrency(campaign.revenue)}</span>
                            )}
                          </>
                        ) : campaign.status === 'scheduled' ? (
                          <span style={{ fontSize:11, color:'var(--text-2)' }}>{campaign.segment}</span>
                        ) : campaign.status === 'draft' ? (
                          <span style={{ fontSize:11, color:'var(--text-3)' }}>Taslak — henüz gönderilmedi</span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {(campaign.status === 'completed' || campaign.status === 'active') && (
                          <>
                            <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="default">
                              <BarChart2 className="w-3 h-3"/> Rapor
                            </ActionBtn>
                            <ActionBtn onClick={() => handleClone(campaign.id)} variant="default">
                              <Copy className="w-3 h-3"/> Kopyala
                            </ActionBtn>
                          </>
                        )}
                        {campaign.status === 'scheduled' && (
                          <>
                            <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="primary">
                              <FileEdit className="w-3 h-3"/> Düzenle
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id} variant="danger">
                              {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Ban className="w-3 h-3"/>} İptal
                            </ActionBtn>
                          </>
                        )}
                        {campaign.status === 'draft' && (
                          <>
                            <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="primary">
                              <PlayCircle className="w-3 h-3"/> Devam Et
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id} variant="danger">
                              {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>} Sil
                            </ActionBtn>
                          </>
                        )}
                        {campaign.status === 'sending' && (
                          <ActionBtn onClick={() => router.push(`/campaigns/${campaign.id}`)} variant="default">
                            <Eye className="w-3 h-3"/> Detay
                          </ActionBtn>
                        )}
                        {campaign.status === 'failed' && (
                          <>
                            <ActionBtn onClick={() => handleSend(campaign.id)} disabled={sendingId === campaign.id} variant="primary">
                              {sendingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3"/>} Yeniden Dene
                            </ActionBtn>
                            <ActionBtn onClick={() => handleDelete(campaign.id)} disabled={deletingId === campaign.id} variant="danger">
                              {deletingId === campaign.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>} Sil
                            </ActionBtn>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="h-4"/>
            </div>
          </div>
      </div>
    </AppShell>
  )
}
