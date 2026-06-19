'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  sent: number
  opened: number
  clicked: number
  createdAt: string
  scheduledAt: string | null
  sentAt: string | null
  segment: string | null
}


const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: 'Taslak',        color: '#6B7280', bg: '#F3F4F6',  dot: '#9CA3AF' },
  scheduled: { label: 'Planlandı',     color: 'var(--amber)', bg: '#FEF3C7', dot: '#D97706' },
  sending:   { label: 'Gönderiliyor',  color: 'var(--blue)',  bg: '#DBEAFE', dot: '#2563EB' },
  active:    { label: 'Gönderildi',    color: 'var(--green)', bg: '#DCFCE7', dot: '#16A34A' },
  sent:      { label: 'Gönderildi',    color: 'var(--green)', bg: '#DCFCE7', dot: '#16A34A' },
  paused:    { label: 'Duraklatıldı',  color: 'var(--red)',   bg: '#FEE2E2', dot: '#DC2626' },
}

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
}

function StatPill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--text-3)' }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{label}</span>
    </div>
  )
}

export default function BroadcastsPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch('/api/campaigns?limit=100')
      .then(r => r.json())
      .then((d: unknown) => setCampaigns(Array.isArray(d) ? (d as Campaign[]) : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const emailCampaigns = campaigns.filter(c => {
    const matchFilter = filter === 'all' || c.status === filter || (filter === 'sent' && c.status === 'active')
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.subject ?? '').toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const stats = {
    total:     campaigns.length,
    sent:      campaigns.filter(c => c.status === 'active' || c.status === 'sent').length,
    totalSent: campaigns.reduce((a, c) => a + (c.sent ?? 0), 0),
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Yayınlar</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta kampanyalarınızı görüntüleyin ve yönetin</p>
        </div>
        <a
          href="/campaigns/new"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Yeni Kampanya
        </a>
      </div>

      {/* Overview stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
              <Skeleton h={28} w={60} />
              <div style={{ marginTop: 6 }}><Skeleton h={12} w={100} /></div>
            </div>
          ))
        ) : (
          <>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{stats.total}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Toplam Kampanya</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>{stats.sent}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Gönderilmiş</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 22px' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--blue)' }}>{stats.totalSent.toLocaleString('tr-TR')}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Toplam Gönderilen E-posta</div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)', pointerEvents: 'none' }}>search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Kampanya ara…"
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 13, outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3 }}>
          {[
            { key: 'all',       label: 'Tümü' },
            { key: 'draft',     label: 'Taslak' },
            { key: 'scheduled', label: 'Planlandı' },
            { key: 'sent',      label: 'Gönderildi' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500, border: 'none',
                background: filter === f.key ? 'rgba(68,112,255,0.18)' : 'transparent',
                color: filter === f.key ? 'var(--blue)' : 'var(--text-2)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 100px', padding: '10px 18px', borderBottom: '1px solid var(--border)', background: '#F9FAFB' }}>
          {['Kampanya', 'Gönderilen', 'Açılma', 'Tıklanma', 'Durum'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 100px', padding: '14px 18px', borderBottom: '1px solid #F3F4F6', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton h={13} w={180} />
                <Skeleton h={11} w={220} />
              </div>
              <Skeleton h={14} w={50} />
              <Skeleton h={14} w={40} />
              <Skeleton h={14} w={40} />
              <Skeleton h={22} w={80} />
            </div>
          ))
        ) : emailCampaigns.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--text-3)', display: 'block', marginBottom: 12 }}>campaign</span>
            <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Kampanya bulunamadı</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              {filter !== 'all' ? 'Bu filtreyle kampanya yok.' : 'İlk kampanyanızı oluşturun.'}
            </div>
            <a href="/campaigns/new" style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--blue)', color: '#fff', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>
              Kampanya Oluştur
            </a>
          </div>
        ) : (
          emailCampaigns.map((c, idx) => {
            const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft
            const openRate = c.sent > 0 && c.opened > 0 ? `%${((c.opened / c.sent) * 100).toFixed(1)}` : '—'
            const clickRate = c.opened > 0 && c.clicked > 0 ? `%${((c.clicked / c.opened) * 100).toFixed(1)}` : '—'
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/campaigns/${c.id}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 100px',
                  padding: '14px 18px',
                  borderBottom: idx < emailCampaigns.length - 1 ? '1px solid #F3F4F6' : 'none',
                  alignItems: 'center', cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                    {c.subject}
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <StatPill icon="calendar_today" value={new Date(c.createdAt).toLocaleDateString('tr-TR')} label="" />
                    {c.segment && <StatPill icon="donut_small" value={c.segment} label="" />}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{c.sent?.toLocaleString('tr-TR') ?? '—'}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{openRate}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--violet)' }}>{clickRate}</div>
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, fontWeight: 600, color: cfg.color, background: cfg.bg,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                    {cfg.label}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
