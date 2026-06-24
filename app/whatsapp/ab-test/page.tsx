'use client'

import { useState, useEffect } from 'react'
import { Loader2, Plus, X, Trophy } from 'lucide-react'

interface ABTest {
  id: string
  name: string
  variantA: { templateName: string; traffic: number; readRate: number }
  variantB: { templateName: string; traffic: number; readRate: number }
  status: 'RUNNING' | 'COMPLETED' | 'DRAFT'
  winner: 'A' | 'B' | null
  audienceSize: number
  createdAt: string
}

interface Template {
  id: string
  name: string
  status: string
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  RUNNING:   { label: 'Devam Ediyor', bg: '#DBEAFE', color: '#2563EB' },
  COMPLETED: { label: 'Tamamlandı',   bg: '#DCFCE7', color: '#16A34A' },
  DRAFT:     { label: 'Taslak',       bg: '#F3F4F6', color: 'var(--text-2)' },
}

function StatChip({ icon, value, label, color = '#6B7280' }: { icon: string; value: string | number; label: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 12px' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color }}>{icon}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
    </div>
  )
}

function VariantCard({ label, data, isWinner }: { label: 'A' | 'B'; data: ABTest['variantA']; isWinner: boolean }) {
  return (
    <div style={{
      flex: 1, borderRadius: 8, padding: '14px 16px',
      background: isWinner ? '#F0FDF4' : '#F9FAFB',
      border: isWinner ? '2px solid #16A34A' : '1px solid #E5E7EB',
      position: 'relative',
    }}>
      {isWinner && (
        <div style={{ position: 'absolute', top: -10, right: 10, background: '#16A34A', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Trophy size={10} /> KAZANAN
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: isWinner ? '#16A34A' : '#E5E7EB', color: isWinner ? '#fff' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{label}</div>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#374151' }}>{data.templateName}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: isWinner ? '#16A34A' : '#111827' }}>{data.readRate > 0 ? `${data.readRate.toFixed(1)}%` : '—'}</span>
        {data.readRate > 0 && <span style={{ fontSize: 11, color: 'var(--text-2)' }}>okunma oranı</span>}
      </div>
      <div style={{ marginTop: 8, height: 5, background: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${data.readRate}%`, background: isWinner ? '#16A34A' : '#2563EB', borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>%{data.traffic} trafik</p>
    </div>
  )
}

const inpStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text-1)', outline: 'none',
}

export default function ABTestPage() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [cName, setCName] = useState('')
  const [cTemplateA, setCTemplateA] = useState('')
  const [cTemplateB, setCTemplateB] = useState('')
  const [cTrafficA, setCTrafficA] = useState(50)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/whatsapp/ab-tests')
      .then(r => r.ok ? r.json() : { tests: [] })
      .then(d => setTests(d?.tests ?? []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/whatsapp/templates')
      .then(r => r.ok ? r.json() : { templates: [] })
      .then(d => setTemplates((d.templates ?? []).filter((t: Template) => t.status === 'APPROVED')))
      .catch(() => null)
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/whatsapp/ab-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cName, templateA: cTemplateA, templateB: cTemplateB, trafficA: cTrafficA }),
      })
      if (res.ok) {
        const data = await fetch('/api/whatsapp/ab-tests').then(r => r.json())
        setTests(data?.tests ?? [])
      }
      setShowCreate(false)
      setCName(''); setCTemplateA(''); setCTemplateB(''); setCTrafficA(50)
    } catch { /* ignore */ } finally { setCreating(false) }
  }

  const running = tests.filter(t => t.status === 'RUNNING').length
  const completed = tests.filter(t => t.status === 'COMPLETED').length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>A/B Testler</h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>Şablon varyantlarını karşılaştırarak en iyisini bulun</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          <Plus size={14} /> Yeni Test
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip icon="science" value={tests.length} label="toplam" />
        <StatChip icon="play_circle" value={running} label="devam ediyor" color="#2563EB" />
        <StatChip icon="check_circle" value={completed} label="tamamlandı" color="#16A34A" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, height: 160 }}>
              <div style={{ height: 14, background: '#F3F4F6', borderRadius: 4, width: 200, marginBottom: 12 }} />
              <div style={{ height: 10, background: '#F3F4F6', borderRadius: 4, width: 120 }} />
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '48px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#D1D5DB', display: 'block', marginBottom: 10 }}>science</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>Henüz A/B testi yok</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px' }}>Farklı şablon varyantlarını test ederek dönüşüm oranınızı artırın</p>
          <button onClick={() => setShowCreate(true)} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> İlk Testi Oluştur
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tests.map(test => {
            const stsCfg = STATUS_CONFIG[test.status]
            return (
              <div key={test.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: '0 0 4px' }}>{test.name}</h3>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ background: stsCfg.bg, color: stsCfg.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6 }}>{stsCfg.label}</span>
                      {test.audienceSize > 0 && <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{test.audienceSize.toLocaleString('tr')} kişi</span>}
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(test.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <VariantCard label="A" data={test.variantA} isWinner={test.winner === 'A'} />
                  <VariantCard label="B" data={test.variantB} isWinner={test.winner === 'B'} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 12, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Yeni A/B Testi</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Test Adı</span>
                <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Başlık karşılaştırma testi" style={inpStyle} autoFocus />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Varyant A — Şablon</span>
                  <select value={cTemplateA} onChange={e => setCTemplateA(e.target.value)} style={inpStyle}>
                    <option value="">Seçin…</option>
                    {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </label>
                <label style={{ display: 'block' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Varyant B — Şablon</span>
                  <select value={cTemplateB} onChange={e => setCTemplateB(e.target.value)} style={inpStyle}>
                    <option value="">Seçin…</option>
                    {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </label>
              </div>
              {templates.length === 0 && (
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Onaylı şablon bulunamadı. Şablonlar sayfasından senkronize edin.</p>
              )}
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  A Trafik Oranı: %{cTrafficA} — %{100 - cTrafficA}
                </span>
                <input type="range" min={10} max={90} value={cTrafficA} onChange={e => setCTrafficA(Number(e.target.value))} style={{ width: '100%' }} />
              </label>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreate(false)} style={{ background: '#F3F4F6', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#374151' }}>İptal</button>
              <button onClick={handleCreate} disabled={creating || !cName || !cTemplateA || !cTemplateB} style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: !cName || !cTemplateA || !cTemplateB ? 0.5 : 1 }}>
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                {creating ? 'Oluşturuluyor…' : 'Testi Başlat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
