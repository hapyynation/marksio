'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Loader2, Upload, Search } from 'lucide-react'

interface Subscriber {
  id: string
  phone: string
  name: string | null
  optIn: boolean
  lastMessageAt: string | null
  tags: string[]
}


function windowOpen(lastMessageAt: string | null): boolean {
  if (!lastMessageAt) return false
  return Date.now() - new Date(lastMessageAt).getTime() < 86400000
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)} sn önce`
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dk önce`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} sa önce`
  return `${Math.floor(diff / 86400000)} gün önce`
}

function initials(name: string | null, phone: string): string {
  if (name) return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return phone.slice(-2)
}

function avatarColor(id: string): string {
  const colors = ['#DBEAFE', '#EDE9FE', '#DCFCE7', '#FEF3C7', '#FCE7F3']
  const textColors = ['#2563EB', '#7C3AED', '#16A34A', '#D97706', '#DB2777']
  const i = id.charCodeAt(0) % 5
  return colors[i]
}
function avatarText(id: string): string {
  const textColors = ['#2563EB', '#7C3AED', '#16A34A', '#D97706', '#DB2777']
  const i = id.charCodeAt(0) % 5
  return textColors[i]
}

function StatChip({ icon, value, label, color = '#6B7280' }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 20, padding: '4px 12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{value}</span>
      <span style={{ fontSize: 11, color: '#6B7280' }}>{label}</span>
    </div>
  )
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/subscribers')
      if (res.ok) {
        const d = await res.json()
        setSubscribers(d.subscribers ?? [])
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const form = new FormData()
    form.append('file', file)
    try {
      await fetch('/api/whatsapp/subscribers/import', { method: 'POST', body: form })
      load()
    } catch { /* ignore */ } finally { setImporting(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const allTags = [...new Set(subscribers.flatMap(s => s.tags))]
  const filtered = subscribers.filter(s =>
    (search === '' || s.phone.includes(search) || (s.name?.toLowerCase().includes(search.toLowerCase()) ?? false)) &&
    (tagFilter === '' || s.tags.includes(tagFilter))
  )

  const optInCount = subscribers.filter(s => s.optIn).length
  const optOutCount = subscribers.filter(s => !s.optIn).length
  const windowOpenCount = subscribers.filter(s => windowOpen(s.lastMessageAt)).length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Aboneler</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>WhatsApp abone listenizi yönetin</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="file" ref={fileRef} accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            {importing ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            CSV Yükle
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip icon="group" value={subscribers.length} label="toplam" />
        <StatChip icon="check_circle" value={optInCount} label="opt-in (aktif)" color="#16A34A" />
        <StatChip icon="cancel" value={optOutCount} label="opt-out" color="#DC2626" />
        <StatChip icon="chat_bubble" value={windowOpenCount} label="pencere açık" color="#2563EB" />
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="İsim veya telefon ara…"
            style={{ width: '100%', paddingLeft: 36, background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 14px 9px 36px', fontSize: 13, color: '#111827', outline: 'none' }}
          />
        </div>
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={e => setTagFilter(e.target.value)} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 14px', fontSize: 13, color: '#374151', outline: 'none' }}>
            <option value="">Tüm etiketler</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
              {['Abone', 'Opt-in', 'Son Mesaj', 'Pencere', 'Etiketler'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 600, color: '#6B7280', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    {[180, 60, 80, 60, 120].map((w, j) => (
                      <td key={j} style={{ padding: '12px 14px' }}><div style={{ height: 12, background: '#F3F4F6', borderRadius: 4, width: w }} /></td>
                    ))}
                  </tr>
                ))
              : filtered.length === 0
              ? (
                <tr><td colSpan={5}>
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#D1D5DB', display: 'block', marginBottom: 10 }}>group</span>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
                      {search || tagFilter ? 'Aramayla eşleşen abone bulunamadı' : 'Henüz abone yok'}
                    </p>
                    <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px' }}>
                      {search || tagFilter ? 'Filtrelerinizi değiştirmeyi deneyin' : 'CSV dosyası yükleyerek aboneleri içe aktarın'}
                    </p>
                    {!search && !tagFilter && (
                      <>
                        <img src="/whatsapp/empty-subscribers.png" alt="Abone yok" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12, marginBottom: 12, opacity: 0.85 }} />
                        <button onClick={() => fileRef.current?.click()} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <Upload size={13} /> CSV Yükle
                        </button>
                      </>
                    )}
                  </div>
                </td></tr>
              )
              : filtered.map((s, idx) => {
                  const open = windowOpen(s.lastMessageAt)
                  return (
                    <tr
                      key={s.id}
                      style={{ borderBottom: idx < filtered.length - 1 ? '1px solid #F3F4F6' : 'none', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: avatarColor(s.id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: avatarText(s.id), flexShrink: 0 }}>
                            {initials(s.name, s.phone)}
                          </div>
                          <div>
                            {s.name && <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{s.name}</p>}
                            <p style={{ fontSize: 12, color: s.name ? '#6B7280' : '#111827', margin: 0 }}>{s.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: s.optIn ? '#DCFCE7' : '#FEE2E2',
                          color: s.optIn ? '#16A34A' : '#DC2626',
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        }}>
                          {s.optIn ? 'Aktif' : 'Çıktı'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 12, color: '#6B7280' }}>
                          {s.lastMessageAt ? relTime(s.lastMessageAt) : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          background: open ? '#DCFCE7' : '#F3F4F6',
                          color: open ? '#16A34A' : '#9CA3AF',
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        }}>
                          {open ? 'Açık' : 'Kapalı'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {s.tags.length === 0
                            ? <span style={{ fontSize: 12, color: '#9CA3AF' }}>—</span>
                            : s.tags.map(tag => (
                                <span key={tag} style={{ background: '#EDE9FE', color: '#7C3AED', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4 }}>{tag}</span>
                              ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
