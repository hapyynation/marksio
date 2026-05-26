'use client'

import { useState, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import Header from '@/components/layout/Header'
import {
  Users, Crown, Heart, AlertTriangle, UserPlus, UserMinus,
  Plus, TrendingUp, Mail, MessageSquare, Sparkles, X, Check, Loader2,
  Zap, Filter, MoreHorizontal, ArrowRight, Bot,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Segment {
  id: string; name: string; description?: string; type: string
  count: number; color: string; icon: string; rules: Rule[]; createdAt: string
}
interface Rule { field: string; operator: string; value: string }

const ICON_MAP: Record<string, React.ElementType> = {
  Crown, Heart, AlertTriangle, UserPlus, UserMinus, Users,
}

const RULE_FIELDS = [
  { value: 'totalOrders', label: 'Toplam Sipariş' },
  { value: 'totalSpent', label: 'Toplam Harcama (₺)' },
  { value: 'daysSinceOrder', label: 'Son Siparişten Gün' },
  { value: 'score', label: 'Müşteri Skoru' },
]
const RULE_OPERATORS = [
  { value: 'gt', label: '>' }, { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' }, { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
]
const COLORS: Array<{ key: string; dot: string }> = [
  { key: 'violet', dot: 'bg-violet-500' }, { key: 'blue', dot: 'bg-blue-500' },
  { key: 'emerald', dot: 'bg-emerald-500' }, { key: 'amber', dot: 'bg-amber-500' },
  { key: 'red', dot: 'bg-red-500' },
]

const SEGMENT_META: Record<string, {
  score: number; convRate: number
  badge: string; badgeIcon: React.ElementType
  badgeCls: string; chartColor: string; trackColor: string
  recommended: string
}> = {
  vip:      { score: 92, convRate: 88, badge: 'Upsell\'e Hazır',        badgeIcon: TrendingUp,    badgeCls: 'bg-[#b3c5ff]/10 border-[#b3c5ff]/25 text-[#b3c5ff]', chartColor: '#b3c5ff', trackColor: '#272a33', recommended: 'VIP Sadakat Kampanyası' },
  loyal:    { score: 78, convRate: 65, badge: 'Nurture Phase',           badgeIcon: Heart,         badgeCls: 'bg-[#d0bcff]/10 border-[#d0bcff]/25 text-[#d0bcff]', chartColor: '#d0bcff', trackColor: '#272a33', recommended: 'Tekrar Alım Kampanyası' },
  at_risk:  { score: 35, convRate: 15, badge: 'Churn Riski Yüksek',     badgeIcon: AlertTriangle, badgeCls: 'bg-red-500/10 border-red-500/25 text-red-400',        chartColor: '#f87171', trackColor: '#272a33', recommended: 'Geri Kazanım Kampanyası' },
  new:      { score: 65, convRate: 45, badge: 'Nurture Phase',           badgeIcon: UserPlus,      badgeCls: 'bg-[#d0bcff]/10 border-[#d0bcff]/25 text-[#d0bcff]', chartColor: '#d0bcff', trackColor: '#272a33', recommended: 'Hoş Geldin Serisi' },
  inactive: { score: 20, convRate: 8,  badge: 'Win-Back Gerekli',        badgeIcon: UserMinus,     badgeCls: 'bg-red-500/10 border-red-500/25 text-red-400',        chartColor: '#f87171', trackColor: '#272a33', recommended: 'Win-Back Kampanyası' },
}

function RadialChart({ score, color, track }: { score: number; color: string; track: string }) {
  return (
    <div className="relative w-16 h-16">
      <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={track} strokeWidth="3" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${score}, 100`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[13px] font-bold text-[#e1e2ee]">{score}</span>
      </div>
    </div>
  )
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: 'violet', rules: [] as Rule[] })
  const [saving, setSaving] = useState(false)
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null)

  useEffect(() => { fetchSegments() }, [])

  async function fetchSegments() {
    setLoading(true)
    const res = await fetch('/api/segments')
    if (res.ok) setSegments(await res.json())
    setLoading(false)
  }

  function addRule() {
    setForm(f => ({ ...f, rules: [...f.rules, { field: 'totalOrders', operator: 'gt', value: '0' }] }))
  }
  function removeRule(i: number) {
    setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }))
  }
  function updateRule(i: number, key: keyof Rule, value: string) {
    setForm(f => { const r = [...f.rules]; r[i] = { ...r[i], [key]: value }; return { ...f, rules: r } })
  }
  async function createSegment() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/segments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { await fetchSegments(); setShowCreate(false); setForm({ name: '', description: '', color: 'violet', rules: [] }) }
    setSaving(false)
  }
  async function deleteSegment(id: string) {
    if (!confirm('Bu segmenti silmek istediğinizden emin misiniz?')) return
    await fetch(`/api/segments/${id}`, { method: 'DELETE' })
    setActiveSegment(null); fetchSegments()
  }

  const builtinSegments = segments.filter(s => s.type === 'builtin')
  const customSegments  = segments.filter(s => s.type === 'custom')
  const atRisk  = builtinSegments.find(s => s.id === 'at_risk' || s.name?.toLowerCase().includes('risk'))
  const vip     = builtinSegments.find(s => s.id === 'vip'     || s.name?.toLowerCase().includes('vip'))
  const loyal   = builtinSegments.find(s => s.id === 'loyal')

  // Dynamic AI insight
  const aiInsight = atRisk && loyal && atRisk.count > loyal.count
    ? { title: 'AI Risk Tespiti', badge: 'Acil', text: `"${atRisk.name}" segmenti son 72 saatte büyüdü. Tavsiye: Churn'ü önlemek için Win-Back kampanyası başlatın.`, action: 'Kampanya Oluştur', href: `/campaigns/new?segment=${atRisk.name}` }
    : vip && vip.count > 0
    ? { title: 'AI Fırsat Tespiti', badge: 'Yeni', text: `${vip.count} VIP müşteriniz upsell için hazır. Özel erken erişim kampanyasıyla geliri artırın.`, action: 'Kampanya Oluştur', href: `/campaigns/new?segment=${vip.name}` }
    : { title: 'AI Segmentasyon Hazır', badge: 'Bilgi', text: 'Segmentleriniz otomatik olarak güncelleniyor. Kampanya oluşturmak için bir segmente tıklayın.', action: 'Kampanya Oluştur', href: '/campaigns/new' }

  // Purchase frequency from segments (estimated)
  const totalCustomers = segments.reduce((s, seg) => s + seg.count, 0)

  return (
    <AppShell>
      <Header
        title="Customer Intelligence"
        subtitle="Gerçek zamanlı segmentasyon ve davranışsal analiz"
        actions={[{ label: '+ Yeni Segment', href: '#', variant: 'primary' }]}
      />

      <div className="flex-1 overflow-y-auto bg-[#10131c] animate-fade-in">
        <div className="max-w-[1440px] mx-auto px-6 pt-8 pb-12">

          {/* Filter row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#e1e2ee] tracking-tight mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>Segmentler</h2>
              <p className="text-sm text-[#8c90a1]">AI destekli müşteri grupları ve öngörüler</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex bg-[#191b24] rounded-lg p-1 border border-[#424656]/30">
                {(['all', 'favorites'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all', f === filter
                      ? 'bg-[#272a33] text-[#e1e2ee] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                      : 'text-[#8c90a1] hover:text-[#e1e2ee]')}>
                    {f === 'all' ? 'Tüm Segmentler' : 'Favoriler'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#424656]/40 text-[#8c90a1] hover:border-[#b3c5ff]/40 hover:text-[#b3c5ff] transition-all text-xs font-medium glass-border"
                style={{ background: 'rgba(29,31,40,0.6)', backdropFilter: 'blur(8px)' }}
              >
                <Filter className="w-3.5 h-3.5" /> Filtrele
              </button>
            </div>
          </div>

          {/* AI Insight Banner */}
          <div className="mb-8 p-4 rounded-xl border border-[#d0bcff]/25 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(87,27,193,0.12) 0%, rgba(11,14,22,0.8) 100%)' }}>
            <div className="absolute right-0 top-0 w-64 h-full pointer-events-none"
              style={{ background: 'linear-gradient(270deg, rgba(208,188,255,0.06) 0%, transparent 100%)' }} />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full border border-[#d0bcff]/40 flex items-center justify-center shrink-0"
                style={{ background: 'rgba(87,27,193,0.3)' }}>
                <Bot className="w-5 h-5 text-[#d0bcff]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#e1e2ee] mb-1 flex items-center gap-2" style={{ fontFamily: 'Geist, sans-serif' }}>
                  {aiInsight.title}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d0bcff]/15 text-[#d0bcff] border border-[#d0bcff]/25 uppercase tracking-wider">
                    {aiInsight.badge}
                  </span>
                </h3>
                <p className="text-sm text-[#8c90a1]">{aiInsight.text}</p>
                <Link href={aiInsight.href}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#b3c5ff] hover:text-white transition-colors">
                  {aiInsight.action} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Segment Bento Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl bg-[#1a1e2b] h-40 animate-pulse">
                  <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {builtinSegments.map(seg => {
                const Icon = ICON_MAP[seg.icon] ?? Users
                const meta = SEGMENT_META[seg.id] ?? SEGMENT_META['new']
                const BadgeIcon = meta.badgeIcon
                return (
                  <div key={seg.id} className="bento-card p-5 flex flex-col justify-between cursor-pointer"
                    onClick={() => setActiveSegment(seg)}>
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <h3 className="text-base font-bold text-[#e1e2ee] mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>{seg.name}</h3>
                        <p className="text-[11px] text-[#8c90a1]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                          {seg.count.toLocaleString('tr-TR')} kullanıcı
                        </p>
                      </div>
                      <button className="text-[#424656] hover:text-[#8c90a1] transition-colors" onClick={e => { e.stopPropagation(); setActiveSegment(seg) }}>
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-5 mb-5">
                      <RadialChart score={meta.score} color={meta.chartColor} track={meta.trackColor} />
                      <div>
                        <p className="text-[10px] text-[#8c90a1] uppercase tracking-wider mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>Sadakat Skoru</p>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-bold text-[#e1e2ee] leading-none">{meta.convRate}%</span>
                          <span className="text-[11px] text-[#b3c5ff] mb-0.5 font-medium">Tahm. Dönüşüm</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#272a33]">
                      <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border', meta.badgeCls)}>
                        <BadgeIcon className="w-3 h-3" />
                        {meta.badge}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Custom segments as bento cards */}
              {customSegments.map(seg => (
                <div key={seg.id} className="bento-card p-5 flex flex-col justify-between cursor-pointer"
                  onClick={() => setActiveSegment(seg)}>
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="text-base font-bold text-[#e1e2ee] mb-1" style={{ fontFamily: 'Geist, sans-serif' }}>{seg.name}</h3>
                      <p className="text-[11px] text-[#8c90a1]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {seg.count.toLocaleString('tr-TR')} kullanıcı · {seg.rules.length} kural
                      </p>
                    </div>
                    <button className="text-[#424656] hover:text-[#8c90a1] transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                  <RadialChart score={Math.min(seg.count > 0 ? 55 : 0, 99)} color="#d0bcff" track="#272a33" />
                  <div className="pt-4 mt-4 border-t border-[#272a33]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border bg-[#d0bcff]/10 border-[#d0bcff]/25 text-[#d0bcff]">
                      <Sparkles className="w-3 h-3" /> Özel Segment
                    </div>
                  </div>
                </div>
              ))}

              {/* Add new segment card */}
              <button onClick={() => setShowCreate(true)}
                className="bento-card p-5 flex flex-col items-center justify-center gap-3 border-dashed hover:border-[#b3c5ff]/30 transition-all min-h-[180px]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(179,197,255,0.08)', border: '1px solid rgba(179,197,255,0.2)' }}>
                  <Plus className="w-5 h-5 text-[#b3c5ff]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#e1e2ee]">Yeni Segment</p>
                  <p className="text-xs text-[#8c90a1] mt-0.5">Özel kural oluştur</p>
                </div>
              </button>
            </div>
          )}

          {/* Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Line Chart */}
            <div className="lg:col-span-2 bento-card p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold text-[#e1e2ee]" style={{ fontFamily: 'Geist, sans-serif' }}>Segment Büyüme Dinamiği</h3>
                  <p className="text-[11px] text-[#8c90a1] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>30 günlük trend</p>
                </div>
                <div className="flex gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-[#8c90a1]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span className="w-2 h-2 rounded-full bg-[#b3c5ff]" /> VIP
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-[#8c90a1]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <span className="w-2 h-2 rounded-full bg-[#d0bcff]" /> Risk
                  </span>
                </div>
              </div>
              <div className="flex-1 relative min-h-[200px] border-b border-l border-[#272a33]">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0,1,2,3].map(i => <div key={i} className="w-full h-px bg-[#272a33]" />)}
                </div>
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="vipGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(179,197,255,0.15)" />
                      <stop offset="100%" stopColor="rgba(179,197,255,0)" />
                    </linearGradient>
                  </defs>
                  <path d="M0,80 Q20,70 40,50 T80,30 T100,20 L100,100 L0,100 Z" fill="url(#vipGrad)" />
                  <path d="M0,80 Q20,70 40,50 T80,30 T100,20" fill="none" stroke="#b3c5ff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                  <path d="M0,90 Q30,85 50,70 T80,80 T100,65" fill="none" stroke="#d0bcff" strokeWidth="1" strokeDasharray="4 2" vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-[#8c90a1]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {['30 gün önce', '15 gün önce', 'Bugün'].map(l => <span key={l}>{l}</span>)}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bento-card p-6 flex flex-col">
              <h3 className="text-sm font-bold text-[#e1e2ee] mb-6" style={{ fontFamily: 'Geist, sans-serif' }}>Satın Alma Sıklığı</h3>
              <div className="space-y-5 flex-1">
                {[
                  { label: 'Günlük Alıcı',  pct: 12, color: '#b3c5ff' },
                  { label: 'Haftalık',       pct: 34, color: '#b3c5ff' },
                  { label: 'Aylık',          pct: 48, color: '#b3c5ff' },
                  { label: 'Pasif',          pct: 6,  color: '#f87171' },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[#8c90a1]">{row.label}</span>
                      <span style={{ color: row.color, fontFamily: 'JetBrains Mono, monospace' }}>%{row.pct}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#272a33] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-2 rounded border border-[#424656]/40 text-[#8c90a1] hover:text-[#e1e2ee] hover:border-[#b3c5ff]/30 text-xs transition-all"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                Tam Rapor Gör
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Create Segment Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-lg"
            style={{ background: '#0b0e16', border: '1px solid rgba(66,70,86,0.5)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a33]">
              <h3 className="font-bold text-[#e1e2ee]" style={{ fontFamily: 'Geist, sans-serif' }}>Yeni Segment Oluştur</h3>
              <button onClick={() => setShowCreate(false)} className="text-[#8c90a1] hover:text-[#e1e2ee] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Segment Adı</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Örn: Yüksek Değerli Alıcılar"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-[#e1e2ee] placeholder:text-[#424656] outline-none focus:border-[#b3c5ff]/50 transition-all"
                  style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.5)' }} />
              </div>
              <div>
                <label className="label">Açıklama (opsiyonel)</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Segment açıklaması"
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-[#e1e2ee] placeholder:text-[#424656] outline-none focus:border-[#b3c5ff]/50 transition-all"
                  style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.5)' }} />
              </div>
              <div>
                <label className="label">Renk</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c.key} onClick={() => setForm(f => ({ ...f, color: c.key }))}
                      className={cn('w-7 h-7 rounded-lg transition-all', c.dot, form.color === c.key ? 'ring-2 ring-white/30 ring-offset-2 ring-offset-[#0b0e16] scale-110' : 'opacity-50 hover:opacity-100')} />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">Kurallar</label>
                  <button onClick={addRule} className="text-xs text-[#b3c5ff] hover:text-white font-semibold flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3" /> Kural Ekle
                  </button>
                </div>
                {form.rules.length === 0 && (
                  <p className="text-xs text-[#8c90a1] rounded-xl px-3 py-3 text-center"
                    style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.3)' }}>
                    Kural eklemezseniz tüm müşteriler dahil edilir
                  </p>
                )}
                <div className="space-y-2">
                  {form.rules.map((rule, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.3)' }}>
                      <select value={rule.field} onChange={e => updateRule(i, 'field', e.target.value)}
                        className="text-xs rounded-lg px-2 py-1.5 outline-none flex-1 text-[#e1e2ee]"
                        style={{ background: '#1d1f28', border: '1px solid rgba(66,70,86,0.4)' }}>
                        {RULE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                      </select>
                      <select value={rule.operator} onChange={e => updateRule(i, 'operator', e.target.value)}
                        className="text-xs rounded-lg px-2 py-1.5 outline-none w-14 text-[#e1e2ee]"
                        style={{ background: '#1d1f28', border: '1px solid rgba(66,70,86,0.4)' }}>
                        {RULE_OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input value={rule.value} onChange={e => updateRule(i, 'value', e.target.value)}
                        className="text-xs rounded-lg px-2 py-1.5 outline-none w-20 text-[#e1e2ee]"
                        style={{ background: '#1d1f28', border: '1px solid rgba(66,70,86,0.4)' }} />
                      <button onClick={() => removeRule(i)} className="text-[#8c90a1] hover:text-red-400 transition-colors p-0.5">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 rounded-xl py-2.5 text-sm text-[#8c90a1] hover:text-[#e1e2ee] transition-all"
                style={{ border: '1px solid rgba(66,70,86,0.4)' }}>
                İptal
              </button>
              <button onClick={createSegment} disabled={!form.name.trim() || saving}
                className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: '#0066ff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Detail Panel */}
      {activeSegment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-md"
            style={{ background: '#0b0e16', border: '1px solid rgba(66,70,86,0.5)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#272a33]">
              <h3 className="font-bold text-[#e1e2ee]" style={{ fontFamily: 'Geist, sans-serif' }}>{activeSegment.name}</h3>
              <button onClick={() => setActiveSegment(null)} className="text-[#8c90a1] hover:text-[#e1e2ee] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3" style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.3)' }}>
                  <p className="text-xs text-[#8c90a1]">Müşteri Sayısı</p>
                  <p className="text-2xl font-bold text-[#e1e2ee] tabular-nums">{activeSegment.count.toLocaleString('tr-TR')}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.3)' }}>
                  <p className="text-xs text-[#8c90a1]">Tip</p>
                  <p className="text-sm font-semibold text-[#e1e2ee] mt-1">
                    {activeSegment.type === 'builtin' ? 'Yerleşik' : 'Özel'}
                  </p>
                </div>
              </div>
              {activeSegment.description && <p className="text-sm text-[#8c90a1]">{activeSegment.description}</p>}
              {activeSegment.rules.length > 0 && (
                <div>
                  <p className="label mb-2">Kurallar</p>
                  <div className="space-y-1.5">
                    {activeSegment.rules.map((rule, i) => {
                      const fl = RULE_FIELDS.find(f => f.value === rule.field)?.label ?? rule.field
                      const ol = RULE_OPERATORS.find(o => o.value === rule.operator)?.label ?? rule.operator
                      return (
                        <div key={i} className="text-xs rounded-lg px-3 py-2 text-[#8c90a1]"
                          style={{ background: '#10131c', border: '1px solid rgba(66,70,86,0.3)' }}>
                          {fl} {ol} {rule.value}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <Link href={`/campaigns/new?segment=${activeSegment.name}`}
                  className="flex-1 text-center text-sm font-bold text-white rounded-xl py-2.5 transition-all"
                  style={{ background: '#0066ff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                  Kampanya Oluştur
                </Link>
                {activeSegment.type === 'custom' && (
                  <button onClick={() => deleteSegment(activeSegment.id)}
                    className="px-4 text-sm rounded-xl py-2.5 transition-all text-red-400 hover:bg-red-500/10"
                    style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                    Sil
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
