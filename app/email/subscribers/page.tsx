'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

interface Subscriber {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  segment: string | null
  createdAt: string
  unsubscribed: boolean
  totalOrders: number
  totalSpent: number
}

interface SubscriberData {
  customers: Subscriber[]
  total: number
  activeCount: number
  unsubscribedCount: number
  page: number
  totalPages: number
}

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
      background: active ? '#DCFCE7' : '#FEE2E2',
      color: active ? '#16A34A' : '#DC2626',
      border: `1px solid ${active ? '#BBF7D0' : '#FECACA'}`,
    }}>
      {active ? 'Aktif' : 'İptal'}
    </span>
  )
}

function SegmentBadge({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 6,
      background: '#EDE9FE', color: '#7C3AED',
      border: '1px solid #DDD6FE',
    }}>
      {label}
    </span>
  )
}

export default function SubscribersPage() {
  const [data, setData] = useState<SubscriberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'subscribed' | 'unsubscribed'>('subscribed')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [resubLoading, setResubLoading] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams({ status, page: String(page), search })
    fetch(`/api/email/subscribers?${params}`)
      .then(r => r.json())
      .then(d => { setData(d); setSelected(new Set()) })
      .finally(() => setLoading(false))
  }, [status, page, search])

  useEffect(() => { fetchData() }, [fetchData])

  function handleSearchChange(val: string) {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(val)
      setPage(1)
    }, 350)
  }

  async function handleResubscribe(id: string) {
    setResubLoading(id)
    setOpenMenu(null)
    await fetch(`/api/email/subscribers/${id}/resubscribe`, { method: 'PATCH' })
    setResubLoading(null)
    fetchData()
  }

  function downloadCSV() {
    if (!data?.customers.length) return
    const header = ['İsim', 'E-posta', 'Segment', 'Durum', 'Toplam Sipariş', 'Toplam Harcama', 'Katılım Tarihi']
    const rows = data.customers.map(c => [
      c.name ?? '',
      c.email,
      c.segment ?? '',
      c.unsubscribed ? 'İptal' : 'Aktif',
      String(c.totalOrders),
      String(c.totalSpent),
      new Date(c.createdAt).toLocaleDateString('tr-TR'),
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `aboneler-${status}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const allSelected = data?.customers.length ? selected.size === data.customers.length : false
  function toggleAll() {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(data?.customers.map(c => c.id) ?? []))
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Aboneler</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta listenizdeki kişiler</p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={loading || !data?.customers.length}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)',
            opacity: (!data?.customers.length) ? 0.5 : 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span>
          CSV İndir
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
              <Skeleton h={32} w={80} />
              <div style={{ marginTop: 8 }}><Skeleton h={12} w={120} /></div>
            </div>
          ))
        ) : (
          <>
            <div
              onClick={() => { setStatus('subscribed'); setPage(1) }}
              style={{
                background: status === 'subscribed' ? 'rgba(34,201,122,0.06)' : 'var(--surface)',
                border: `1px solid ${status === 'subscribed' ? 'rgba(34,201,122,0.3)' : 'var(--border)'}`,
                borderRadius: 12, padding: '20px 24px', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>{(data?.activeCount ?? 0).toLocaleString('tr-TR')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Aktif Abone</div>
            </div>
            <div
              onClick={() => { setStatus('unsubscribed'); setPage(1) }}
              style={{
                background: status === 'unsubscribed' ? 'rgba(232,69,69,0.06)' : 'var(--surface)',
                border: `1px solid ${status === 'unsubscribed' ? 'rgba(232,69,69,0.3)' : 'var(--border)'}`,
                borderRadius: 12, padding: '20px 24px', cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--red)' }}>{(data?.unsubscribedCount ?? 0).toLocaleString('tr-TR')}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Abonelikten Çıkan</div>
            </div>
          </>
        )}
      </div>

      {/* Filters + search */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-3)', pointerEvents: 'none' }}>search</span>
          <input
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="E-posta veya isim ara…"
            style={{
              width: '100%', padding: '9px 12px 9px 34px', borderRadius: 8, boxSizing: 'border-box',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text-1)', fontSize: 14, outline: 'none',
            }}
          />
        </div>
        {(['subscribed', 'unsubscribed'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            style={{
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              border: `1px solid ${status === s ? 'var(--blue)' : 'var(--border)'}`,
              background: status === s ? 'rgba(68,112,255,0.12)' : 'transparent',
              color: status === s ? 'var(--blue)' : 'var(--text-2)',
            }}
          >
            {s === 'subscribed' ? 'Aktif' : 'İptal Edilmiş'}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{
          background: 'rgba(68,112,255,0.1)', border: '1px solid rgba(68,112,255,0.25)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 12, fontSize: 13,
        }}>
          <span style={{ color: 'var(--blue)', fontWeight: 600 }}>{selected.size} kişi seçildi</span>
          <button
            onClick={() => setSelected(new Set())}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 12, padding: '2px 8px' }}
          >
            Seçimi Kaldır
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '40px 1fr 140px 90px 120px 80px 40px',
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
        }}>
          <div>
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              style={{ accentColor: 'var(--blue)', width: 14, height: 14, cursor: 'pointer' }}
            />
          </div>
          {['Abone', 'Segment', 'Durum', 'Katılım Tarihi', 'Sipariş', ''].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 140px 90px 120px 80px 40px', padding: '14px 16px', borderBottom: '1px solid #F3F4F6', gap: 8, alignItems: 'center' }}>
              <Skeleton h={14} w={14} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Skeleton h={13} w={120} />
                <Skeleton h={11} w={160} />
              </div>
              <Skeleton h={20} w={70} />
              <Skeleton h={20} w={50} />
              <Skeleton h={12} w={90} />
              <Skeleton h={12} w={30} />
              <div />
            </div>
          ))
        ) : !data?.customers.length ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }}>person_off</span>
            <div style={{ color: 'var(--text-2)', fontWeight: 600 }}>
              {status === 'subscribed' ? 'Aktif abone yok' : 'Abonelikten çıkmış kişi yok'}
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: 13, marginTop: 4 }}>
              {status === 'subscribed' ? 'Müşteri içe aktarınca aboneler burada görünür.' : 'Tüm aboneleriniz aktif durumda.'}
            </div>
          </div>
        ) : (
          data.customers.map((sub, idx) => (
            <div
              key={sub.id}
              style={{
                display: 'grid', gridTemplateColumns: '40px 1fr 140px 90px 120px 80px 40px',
                padding: '13px 16px', borderBottom: idx < data.customers.length - 1 ? '1px solid #F3F4F6' : 'none',
                alignItems: 'center',
                background: selected.has(sub.id) ? 'rgba(68,112,255,0.05)' : 'transparent',
                transition: 'background 0.1s',
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selected.has(sub.id)}
                  onChange={() => {
                    const next = new Set(selected)
                    next.has(sub.id) ? next.delete(sub.id) : next.add(sub.id)
                    setSelected(next)
                  }}
                  style={{ accentColor: 'var(--blue)', width: 14, height: 14, cursor: 'pointer' }}
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.name ?? (`${sub.firstName ?? ''} ${sub.lastName ?? ''}`.trim() || '—')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.email}
                </div>
              </div>
              <div>
                {sub.segment ? <SegmentBadge label={sub.segment} /> : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
              </div>
              <div>
                <StatusBadge active={!sub.unsubscribed} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {new Date(sub.createdAt).toLocaleDateString('tr-TR')}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{sub.totalOrders}</div>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setOpenMenu(openMenu === sub.id ? null : sub.id)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_horiz</span>
                </button>
                {openMenu === sub.id && (
                  <div style={{
                    position: 'absolute', right: 0, top: 30, zIndex: 10,
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                    minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden',
                  }}>
                    {sub.unsubscribed && (
                      <button
                        onClick={() => handleResubscribe(sub.id)}
                        disabled={resubLoading === sub.id}
                        style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
                        {resubLoading === sub.id ? 'İşleniyor…' : 'Yeniden Abone Et'}
                      </button>
                    )}
                    <button
                      onClick={() => setOpenMenu(null)}
                      style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-2)', cursor: 'pointer', fontSize: 13, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 15 }}>person</span>
                      Müşteri Profiline Git
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {(data?.totalPages ?? 0) > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            Toplam <strong style={{ color: 'var(--text-1)' }}>{data!.total}</strong> kayıt
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: page <= 1 ? 'var(--text-3)' : 'var(--text-1)', cursor: page <= 1 ? 'default' : 'pointer', fontSize: 13 }}
            >
              ←
            </button>
            {Array.from({ length: Math.min(5, data!.totalPages) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2
              if (pg > data!.totalPages) return null
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                    border: `1px solid ${pg === page ? 'var(--blue)' : 'var(--border)'}`,
                    background: pg === page ? 'rgba(68,112,255,0.15)' : 'transparent',
                    color: pg === page ? 'var(--blue)' : 'var(--text-1)',
                  }}
                >
                  {pg}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(data!.totalPages, p + 1))}
              disabled={page >= data!.totalPages}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: page >= data!.totalPages ? 'var(--text-3)' : 'var(--text-1)', cursor: page >= data!.totalPages ? 'default' : 'pointer', fontSize: 13 }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
