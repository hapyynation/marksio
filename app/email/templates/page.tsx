'use client'

import { useEffect, useState } from 'react'

interface TemplateItem {
  id: string
  name: string
  description?: string
  type: string
  isDefault: boolean
  usageCount: number
  createdAt?: string
}

interface TemplateData {
  defaults: TemplateItem[]
  custom: TemplateItem[]
  total: number
}

const DEFAULT_META: Record<string, { icon: string; color: string; gradient: string }> = {
  welcome:           { icon: '👋', color: '#22c97a', gradient: 'rgba(34,201,122,0.1)' },
  promotion:         { icon: '🎁', color: '#f0a020', gradient: 'rgba(240,160,32,0.1)' },
  cart_abandonment:  { icon: '🛒', color: '#4470ff', gradient: 'rgba(68,112,255,0.1)' },
  order_confirmation:{ icon: '✅', color: '#9f7afa', gradient: 'rgba(159,122,250,0.1)' },
  win_back:          { icon: '💫', color: '#e84545', gradient: 'rgba(232,69,69,0.1)' },
  custom:            { icon: '📄', color: 'var(--text-2)', gradient: 'rgba(255,255,255,0.04)' },
}

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
}

export default function TemplatesPage() {
  const [data, setData] = useState<TemplateData | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [editName, setEditName] = useState<{ id: string; value: string } | null>(null)

  function fetchData() {
    setLoading(true)
    fetch('/api/email/templates')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    await fetch('/api/email/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
    })
    setNewName(''); setNewDesc('')
    setCreating(false); setShowModal(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return
    setDeleteLoading(id)
    await fetch(`/api/email/templates/${id}`, { method: 'DELETE' })
    setDeleteLoading(null)
    fetchData()
  }

  async function handleRename(id: string) {
    if (!editName || editName.id !== id || !editName.value.trim()) { setEditName(null); return }
    await fetch(`/api/email/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.value.trim() }),
    })
    setEditName(null)
    fetchData()
  }

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
            <h3 style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 17, margin: '0 0 20px' }}>Yeni Şablon Oluştur</h3>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>ŞABLON ADI</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="örn. Mağaza İndirimi"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>AÇIKLAMA (isteğe bağlı)</label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Şablonun ne için kullanıldığı…"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (!newName.trim() || creating) ? 0.5 : 1 }}
              >
                {creating ? 'Oluşturuluyor…' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Şablonlar</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta şablonlarınızı yönetin ve yenilerini oluşturun</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Yeni Şablon
        </button>
      </div>

      {/* Default templates */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Hazır Şablonlar</h2>
          <span style={{ fontSize: 11, color: 'var(--text-3)', background: '#F3F4F6', padding: '2px 8px', borderRadius: 20 }}>5 şablon</span>
        </div>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 18px' }}>
                <Skeleton h={44} w={44} />
                <div style={{ marginTop: 14 }}><Skeleton h={14} w={100} /></div>
                <div style={{ marginTop: 8 }}><Skeleton h={11} w={130} /></div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {(data?.defaults ?? []).map(t => {
              const meta = DEFAULT_META[t.type] ?? DEFAULT_META.custom
              return (
                <div key={t.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '22px 18px',
                  transition: 'border-color 0.15s, transform 0.15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = meta.color; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.gradient, border: `1px solid ${meta.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>
                    {meta.icon}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.4 }}>{t.description}</div>
                  <button style={{
                    width: '100%', padding: '7px 0', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: meta.gradient, border: `1px solid ${meta.color}40`, color: meta.color,
                  }}>
                    Kullan
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Custom templates */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Kayıtlı Şablonlarım</h2>
          {!loading && (
            <span style={{ fontSize: 11, color: 'var(--text-3)', background: '#F3F4F6', padding: '2px 8px', borderRadius: 20 }}>
              {data?.custom.length ?? 0} şablon
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton h={36} w={36} />
                <div style={{ flex: 1 }}><Skeleton h={13} w={150} /></div>
                <Skeleton h={28} w={70} />
              </div>
            ))}
          </div>
        ) : !data?.custom.length ? (
          <div style={{
            background: 'var(--surface)', border: '1px dashed #D1D5DB',
            borderRadius: 12, padding: '48px 24px', textAlign: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--text-3)', display: 'block', marginBottom: 12 }}>description</span>
            <div style={{ fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Henüz kayıtlı şablon yok</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, maxWidth: 300, margin: '0 auto 20px' }}>
              Kendi şablonlarını oluştur ve kampanyalarda kullan.
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              İlk Şablonunu Oluştur
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.custom.map(t => {
              const meta = DEFAULT_META[t.type] ?? DEFAULT_META.custom
              return (
                <div key={t.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  transition: 'border-color 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = '#D1D5DB'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: meta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editName?.id === t.id ? (
                      <input
                        autoFocus
                        value={editName.value}
                        onChange={e => setEditName({ id: t.id, value: e.target.value })}
                        onBlur={() => handleRename(t.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(t.id); if (e.key === 'Escape') setEditName(null) }}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--blue)', color: 'var(--text-1)', fontSize: 14, fontWeight: 600, outline: 'none', width: '100%' }}
                      />
                    ) : (
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    )}
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.description}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', flexShrink: 0 }}>
                    {t.usageCount > 0 ? `${t.usageCount} kez kullanıldı` : 'Hiç kullanılmadı'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditName({ id: t.id, value: t.name })}
                      style={{ padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-2)' }}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleteLoading === t.id}
                      style={{ padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, background: 'transparent', border: '1px solid rgba(232,69,69,0.3)', color: 'var(--red)' }}
                    >
                      {deleteLoading === t.id ? '…' : 'Sil'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
