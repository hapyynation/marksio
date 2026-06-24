'use client'

import { useEffect, useState } from 'react'

interface DnsRecord {
  record?: string
  type?: string
  name?: string
  value?: string
  ttl?: string | number
  status?: string
  priority?: number
}

interface Domain {
  id: string
  domain: string
  status: string
  resendId: string | null
  dnsRecords: string | null
  fromPrefix: string | null
  senderName: string | null
  createdAt: string
  verifiedAt: string | null
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  verified: { label: 'Doğrulandı', color: 'var(--green)', bg: '#DCFCE7', icon: 'check_circle' },
  pending:  { label: 'Bekliyor',   color: 'var(--amber)', bg: '#FEF3C7', icon: 'schedule' },
  failed:   { label: 'Hata',       color: 'var(--red)',   bg: '#FEE2E2', icon: 'error' },
}

function Skeleton({ h = 20, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ height: h, width: w, borderRadius: 6, background: '#F3F4F6', animation: 'pulse 1.5s ease-in-out infinite' }} />
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Kopyala"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 4, color: copied ? 'var(--green)' : 'var(--text-2)' }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{copied ? 'check' : 'content_copy'}</span>
    </button>
  )
}

export default function DomainsPage() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [verifying, setVerifying] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [newDomainResult, setNewDomainResult] = useState<{ domain: Domain; dnsRecords: DnsRecord[] } | null>(null)
  const [verifyResults, setVerifyResults] = useState<Record<string, { status: string; dnsRecords: DnsRecord[] }>>({})

  function fetchDomains() {
    setLoading(true)
    fetch('/api/email/domain')
      .then(r => r.json())
      .then(d => { setDomains(d.domains ?? []); setPlan(d.plan ?? 'free') })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDomains() }, [])

  function parseDns(raw: string | null): DnsRecord[] {
    if (!raw) return []
    try { return JSON.parse(raw) } catch { return [] }
  }

  async function handleVerify(domain: Domain) {
    setVerifying(domain.id)
    try {
      const res = await fetch('/api/email/domain/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: domain.id }),
      })
      const data = await res.json() as { status: string; dnsRecords: DnsRecord[] }
      setVerifyResults(prev => ({ ...prev, [domain.id]: data }))
      fetchDomains()
    } finally {
      setVerifying(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu alan adını silmek istediğinize emin misiniz?')) return
    setDeleting(id)
    await fetch(`/api/email/domain/${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchDomains()
  }

  async function handleAdd() {
    setAddError('')
    if (!newDomain.trim()) { setAddError('Alan adı boş olamaz'); return }
    setAddLoading(true)
    try {
      const res = await fetch('/api/email/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim() }),
      })
      const data = await res.json() as { domain?: Domain; error?: string; requiresUpgrade?: boolean }
      if (!res.ok) {
        setAddError(data.error ?? 'Bir hata oluştu')
        return
      }
      const records = parseDns(data.domain?.dnsRecords ?? null)
      setNewDomainResult({ domain: data.domain!, dnsRecords: records })
      setNewDomain('')
      fetchDomains()
    } finally {
      setAddLoading(false)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canAddDomain = ['growth', 'pro', 'scale', 'agency'].includes(plan)

  return (
    <div style={{ padding: '32px', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Add domain modal */}
      {showAddModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget && !newDomainResult) setShowAddModal(false) }}
        >
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px', width: 520, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            {!newDomainResult ? (
              <>
                <h3 style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 17, margin: '0 0 6px' }}>Alan Adı Ekle</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '0 0 20px' }}>Alan adını ekledikten sonra DNS kayıtlarını kopyalayıp domain yöneticinize eklemeniz gerekecek.</p>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>ALAN ADI</label>
                  <input
                    autoFocus
                    value={newDomain}
                    onChange={e => { setNewDomain(e.target.value); setAddError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="ornekmagazan.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'var(--surface)', border: `1px solid ${addError ? 'var(--red)' : 'var(--border)'}`, color: 'var(--text-1)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                  {addError && <div style={{ color: 'var(--red)', fontSize: 12, marginTop: 6 }}>{addError}</div>}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}>İptal</button>
                  <button
                    onClick={handleAdd}
                    disabled={addLoading || !newDomain.trim()}
                    style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (!newDomain.trim() || addLoading) ? 0.5 : 1 }}
                  >
                    {addLoading ? 'Ekleniyor…' : 'Ekle ve DNS Kayıtlarını Al'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--green)', fontSize: 22 }}>check_circle</span>
                  <h3 style={{ color: 'var(--text-1)', fontWeight: 700, fontSize: 17, margin: 0 }}>Alan adı eklendi!</h3>
                </div>
                <p style={{ color: 'var(--text-2)', fontSize: 13, margin: '0 0 20px' }}>
                  <strong style={{ color: 'var(--text-1)' }}>{newDomainResult.domain.domain}</strong> için DNS kayıtlarını domain yöneticinize ekleyin, ardından &quot;Doğrula&quot; butonuna tıklayın.
                </p>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gridTemplateColumns: '80px 60px 1fr 80px', gap: 8 }}>
                    {['Tür', 'Kayıt', 'Değer', 'Durum'].map(h => (
                      <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase' }}>{h}</div>
                    ))}
                  </div>
                  {newDomainResult.dnsRecords.length > 0 ? newDomainResult.dnsRecords.map((rec, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderBottom: i < newDomainResult.dnsRecords.length - 1 ? '1px solid #F3F4F6' : 'none', display: 'grid', gridTemplateColumns: '80px 60px 1fr 80px', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'rgba(68,112,255,0.1)', padding: '2px 7px', borderRadius: 4, width: 'fit-content' }}>{rec.type ?? rec.record}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-1)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{rec.value}</span>
                        <CopyButton text={rec.value ?? ''} />
                      </div>
                      <span style={{ fontSize: 11, color: rec.status === 'verified' ? 'var(--green)' : 'var(--amber)' }}>
                        {rec.status === 'verified' ? '✓ Aktif' : '⏳ Bekliyor'}
                      </span>
                    </div>
                  )) : (
                    <div style={{ padding: '14px', fontSize: 12, color: 'var(--text-2)' }}>DNS kayıtları yükleniyor…</div>
                  )}
                </div>
                <button
                  onClick={() => { setNewDomainResult(null); setShowAddModal(false) }}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Tamam, Listeye Dön
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>Alan Adları</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '4px 0 0' }}>E-posta gönderim domain'larınızı yönetin</p>
        </div>
        {canAddDomain ? (
          <button
            onClick={() => { setNewDomainResult(null); setAddError(''); setShowAddModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Alan Adı Ekle
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'rgba(240,160,32,0.1)', border: '1px solid rgba(240,160,32,0.25)', fontSize: 13, color: 'var(--amber)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
            Growth planı gerekli
          </div>
        )}
      </div>

      {/* Domain list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Skeleton h={16} w={200} />
                <Skeleton h={22} w={90} />
                <div style={{ flex: 1 }} />
                <Skeleton h={30} w={80} />
                <Skeleton h={30} w={60} />
              </div>
            </div>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px dashed #D1D5DB', borderRadius: 14, padding: '60px 24px', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: 'var(--text-3)', display: 'block', marginBottom: 14 }}>dns</span>
          <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 16, marginBottom: 8 }}>Henüz alan adı eklenmemiş</div>
          <div style={{ fontSize: 14, color: 'var(--text-2)', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Kendi alan adınızdan e-posta göndererek marka itibarınızı güçlendirin ve teslim oranını artırın.
          </div>
          {canAddDomain ? (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
            >
              İlk Alan Adını Ekle
            </button>
          ) : (
            <a href="/plans" style={{ padding: '10px 22px', borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
              Growth Planına Yükselt
            </a>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {domains.map(d => {
            const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.pending
            const isExpanded = expanded.has(d.id)
            const dnsRecords = verifyResults[d.id]?.dnsRecords ?? parseDns(d.dnsRecords)

            return (
              <div key={d.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                {/* Domain row */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-2)', flexShrink: 0 }}>language</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{d.domain}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
                      {d.fromPrefix ? `${d.fromPrefix}@${d.domain}` : d.domain} · Eklenme: {new Date(d.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: cfg.color, background: cfg.bg, padding: '4px 10px', borderRadius: 20, flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{cfg.icon}</span>
                    {cfg.label}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => toggleExpand(d.id)}
                      style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: isExpanded ? 'rgba(68,112,255,0.12)' : 'transparent', border: `1px solid ${isExpanded ? 'var(--blue)' : 'var(--border)'}`, color: isExpanded ? 'var(--blue)' : 'var(--text-2)' }}
                    >
                      DNS Kayıtları
                    </button>
                    {d.status !== 'verified' && (
                      <button
                        onClick={() => handleVerify(d)}
                        disabled={verifying === d.id}
                        style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, background: 'rgba(68,112,255,0.12)', border: '1px solid var(--blue)', color: 'var(--blue)' }}
                      >
                        {verifying === d.id ? 'Kontrol ediliyor…' : 'Doğrula'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(d.id)}
                      disabled={deleting === d.id}
                      style={{ padding: '6px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: 'transparent', border: '1px solid rgba(232,69,69,0.3)', color: 'var(--red)' }}
                    >
                      {deleting === d.id ? '…' : 'Sil'}
                    </button>
                  </div>
                </div>

                {/* DNS records accordion */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                    <div style={{ padding: '12px 16px 6px', display: 'grid', gridTemplateColumns: '70px 1fr 1fr 90px', gap: 8 }}>
                      {['Tür', 'Kayıt Adı', 'Değer', 'Durum'].map(h => (
                        <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                      ))}
                    </div>
                    {dnsRecords.length > 0 ? dnsRecords.map((rec, i) => (
                      <div key={i} style={{ padding: '8px 16px', borderTop: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: '70px 1fr 1fr 90px', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', background: 'rgba(68,112,255,0.1)', padding: '2px 7px', borderRadius: 4, width: 'fit-content' }}>
                          {rec.type ?? rec.record}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rec.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{rec.value}</span>
                          {rec.value && <CopyButton text={rec.value} />}
                        </div>
                        <span style={{ fontSize: 11, color: rec.status === 'verified' ? 'var(--green)' : 'var(--amber)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{rec.status === 'verified' ? 'check_circle' : 'pending'}</span>
                          {rec.status === 'verified' ? 'Aktif' : 'Bekliyor'}
                        </span>
                      </div>
                    )) : (
                      <div style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-2)' }}>
                        DNS kayıtlarını görmek için &quot;Doğrula&quot; butonuna tıklayın.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info card */}
      <div style={{ marginTop: 24, background: 'rgba(68,112,255,0.05)', border: '1px solid rgba(68,112,255,0.15)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--blue)', flexShrink: 0, marginTop: 1 }}>info</span>
        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
          Alan adı doğrulaması DNS yayılması nedeniyle birkaç dakika ile 48 saat arasında sürebilir. DNS kayıtlarınızı ekledikten sonra doğrulama butonuna tıklayın.
        </div>
      </div>
    </div>
  )
}
