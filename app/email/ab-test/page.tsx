'use client'

import { useEffect, useState, useRef } from 'react'

interface ABTest {
  id: string
  name: string
  status: string
  splitPercent: number
  sentA: number
  sentB: number
  openedA: number
  openedB: number
  clickedA: number
  clickedB: number
  variantA: { subject?: string; body?: string }
  variantB: { subject?: string; body?: string }
  winnerVariant: string | null
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  campaignId: string | null
}

interface Campaign {
  id: string
  name: string
  subject: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Taslak',        color: 'var(--text-2)', bg: '#F3F4F6' },
  running:   { label: 'Devam Ediyor',  color: 'var(--blue)',   bg: '#DBEAFE' },
  completed: { label: 'Tamamlandı',    color: 'var(--green)',  bg: '#DCFCE7' },
}

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
}

function ProgressBar({ aVal, bVal, color }: { aVal: number; bVal: number; color: string }) {
  const total = aVal + bVal
  if (total === 0) return <div style={{ height: 4, borderRadius: 4, background: '#E5E7EB' }} />
  const pct = (aVal / total) * 100
  return (
    <div style={{ height: 4, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden', display: 'flex' }}>
      <div style={{ width: `${pct}%`, background: color, borderRadius: '4px 0 0 4px', transition: 'width 0.5s' }} />
      <div style={{ flex: 1, background: '#C4B5FD', borderRadius: '0 4px 4px 0' }} />
    </div>
  )
}

export default function ABTestPage() {
  const [tests, setTests] = useState<ABTest[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [form, setForm] = useState({ name: '', campaignId: '', subjectA: '', subjectB: '', bodyA: '', bodyB: '', split: 50 })
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const splitRef = useRef<HTMLInputElement>(null)

  function fetchTests() {
    setLoading(true)
    fetch('/api/email/ab-tests')
      .then(r => r.json())
      .then(d => setTests(d.tests ?? []))
      .finally(() => setLoading(false))
  }

  function fetchCampaigns() {
    fetch('/api/campaigns?limit=50')
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns ?? []))
      .catch(() => {})
  }

  useEffect(() => { fetchTests() }, [])

  function openModal() {
    fetchCampaigns()
    setForm({ name: '', campaignId: '', subjectA: '', subjectB: '', bodyA: '', bodyB: '', split: 50 })
    setFormError('')
    setShowModal(true)
  }

  async function handleComplete(id: string) {
    setCompleting(id)
    await fetch(`/api/email/ab-tests/${id}/complete`, { method: 'PATCH' })
    setCompleting(null)
    fetchTests()
  }

  async function handleCreate() {
    setFormError('')
    if (!form.name.trim()) { setFormError('Test adı zorunlu'); return }
    if (!form.subjectA.trim() || !form.subjectB.trim()) { setFormError('Her iki varyant için konu satırı gerekli'); return }
    setCreating(true)
    const res = await fetch('/api/email/ab-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:         form.name.trim(),
        campaignId:   form.campaignId || undefined,
        variantA:     { subject: form.subjectA.trim(), body: form.bodyA.trim() },
        variantB:     { subject: form.subjectB.trim(), body: form.bodyB.trim() },
        splitPercent: form.split,
      }),
    })
    setCreating(false)
    if (res.ok) {
      setShowModal(false)
      fetchTests()
    } else {
      const d = await res.json() as { error?: string }
      setFormError(d.error ?? 'Bir hata oluştu')
    }
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* New test modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: '28px', width: '100%', maxWidth: 560, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 17, margin: '0 0 20px' }}>Yeni A/B Test Oluştur</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>TEST ADI</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="örn. Konu satırı testi — Nisan"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {campaigns.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>KAMPANYA (isteğe bağlı)</label>
                  <select
                    value={form.campaignId}
                    onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: form.campaignId ? 'var(--text-1)' : 'var(--text-2)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">Kampanya seçin (isteğe bağlı)</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div style={{ background: 'rgba(68,112,255,0.05)', border: '1px solid rgba(68,112,255,0.15)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, color: 'var(--blue)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--blue)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</div>
                  Varyant A
                </div>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 5 }}>KONU SATIRI *</label>
                  <input
                    value={form.subjectA}
                    onChange={e => setForm(f => ({ ...f, subjectA: e.target.value }))}
                    placeholder="örn. Bu hafta %20 indirim fırsatı!"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 7, background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(159,122,250,0.05)', border: '1px solid rgba(159,122,250,0.15)', borderRadius: 10, padding: 16 }}>
                <div style={{ fontWeight: 600, color: 'var(--violet)', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--violet)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>B</div>
                  Varyant B
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 5 }}>KONU SATIRI *</label>
                  <input
                    value={form.subjectB}
                    onChange={e => setForm(f => ({ ...f, subjectB: e.target.value }))}
                    placeholder="örn. Sadece bugün geçerli büyük indirim"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 7, background: '#F9FAFB', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Split slider */}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 8 }}>
                  BÖLÜNME ORANI
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue)', minWidth: 40, textAlign: 'center' }}>%{form.split}</span>
                  <input
                    ref={splitRef}
                    type="range"
                    min={10} max={90} step={5}
                    value={form.split}
                    onChange={e => setForm(f => ({ ...f, split: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: 'var(--blue)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--violet)', minWidth: 40, textAlign: 'center' }}>%{100 - form.split}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Varyant A</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Varyant B</span>
                </div>
              </div>
            </div>

            {formError && (
              <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 7, background: '#FEE2E2', border: '1px solid #FECACA', color: 'var(--red)', fontSize: 13 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: creating ? 0.6 : 1 }}
              >
                {creating ? 'Oluşturuluyor…' : 'Test Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>A/B Testler</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta varyantlarınızı karşılaştırın ve en iyi performansı bulun</p>
        </div>
        <button
          onClick={openModal}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Yeni A/B Test
        </button>
      </div>

      {/* Test list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
                <Skeleton h={14} w={160} />
                <Skeleton h={22} w={90} />
                <div style={{ flex: 1 }} />
                <Skeleton h={30} w={80} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Skeleton h={70} />
                <Skeleton h={70} />
              </div>
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px dashed #D1D5DB', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-3)', display: 'block', marginBottom: 14 }}>science</span>
          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 16, marginBottom: 8 }}>Henüz A/B test yok</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
            Farklı konu satırlarını test ederek açılma oranını artırın. Hangi mesajın daha iyi çalıştığını verilerle öğrenin.
          </div>
          <button
            onClick={openModal}
            style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            İlk Testini Oluştur
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tests.map(t => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.draft
            const openRateA = t.sentA > 0 ? (t.openedA / t.sentA * 100) : 0
            const openRateB = t.sentB > 0 ? (t.openedB / t.sentB * 100) : 0

            return (
              <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px', overflow: 'hidden' }}>
                {/* Test header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {new Date(t.createdAt).toLocaleDateString('tr-TR')}
                      {t.completedAt && ` · Tamamlandı: ${new Date(t.completedAt).toLocaleDateString('tr-TR')}`}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '4px 10px', borderRadius: 20, flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                  {t.status === 'running' && (
                    <button
                      onClick={() => handleComplete(t.id)}
                      disabled={completing === t.id}
                      style={{ padding: '6px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(34,201,122,0.12)', border: '1px solid var(--green)', color: 'var(--green)', flexShrink: 0 }}
                    >
                      {completing === t.id ? '…' : 'Tamamla'}
                    </button>
                  )}
                </div>

                {/* Variant cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'A', data: t.variantA, sent: t.sentA, opened: t.openedA, clicked: t.clickedA, openRate: openRateA, winner: t.winnerVariant === 'A', color: 'var(--blue)', accentColor: '#4470ff' },
                    { label: 'B', data: t.variantB, sent: t.sentB, opened: t.openedB, clicked: t.clickedB, openRate: openRateB, winner: t.winnerVariant === 'B', color: 'var(--violet)', accentColor: '#9f7afa' },
                  ].map(v => (
                    <div key={v.label} style={{
                      background: v.winner ? (v.label === 'A' ? '#EFF6FF' : '#F5F3FF') : '#F9FAFB',
                      border: `1px solid ${v.winner ? (v.label === 'A' ? '#BFDBFE' : '#DDD6FE') : '#E5E7EB'}`,
                      borderRadius: 10, padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: v.color, color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {v.label}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.data?.subject ?? 'Konu satırı yok'}
                        </div>
                        {v.winner && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: 'var(--green)', padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
                            KAZANAN
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: v.color }}>{v.sent > 0 ? `%${openRateA === openRateB ? '—' : v.openRate.toFixed(1)}` : '—'}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Açılma</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{v.sent.toLocaleString('tr-TR')}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Gönderildi</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-2)' }}>{v.opened.toLocaleString('tr-TR')}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>Açıldı</div>
                        </div>
                      </div>
                      <ProgressBar aVal={v.sent} bVal={t.sentA + t.sentB - v.sent} color={v.accentColor} />
                      <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                        Trafik payı: %{v.label === 'A' ? t.splitPercent : 100 - t.splitPercent}
                      </div>
                    </div>
                  ))}
                </div>

                {t.winnerVariant && (
                  <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', fontSize: 13, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>emoji_events</span>
                    Varyant {t.winnerVariant} daha yüksek açılma oranıyla kazandı
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
