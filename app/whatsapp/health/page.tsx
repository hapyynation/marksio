'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, WifiOff, Key, Eye, EyeOff } from 'lucide-react'

interface HealthData {
  accountId: string
  connectionStatus: string
  phoneNumber: string | null
  displayName: string | null
  verifiedName: string | null
  qualityRating: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN'
  messagingTierLimit: number
  messagingTierUsed: number
  lastWebhookAt: string | null
  hasMetaToken: boolean
}


const QUALITY_CONFIG: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  GREEN:   { label: 'İyi',       color: '#16A34A', bg: '#DCFCE7', desc: 'Hesabınız sağlıklı durumda' },
  YELLOW:  { label: 'Orta',      color: '#D97706', bg: '#FEF3C7', desc: 'Spam şikâyetlerinizi kontrol edin' },
  RED:     { label: 'Düşük',     color: '#DC2626', bg: '#FEE2E2', desc: 'Kısıtlama riski var, dikkat!' },
  UNKNOWN: { label: 'Bilinmiyor', color: '#6B7280', bg: '#F3F4F6', desc: 'Kalite puanı alınamadı' },
}

function CircularGauge({ rating }: { rating: string }) {
  const cfg = QUALITY_CONFIG[rating] ?? QUALITY_CONFIG.UNKNOWN
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const pct = rating === 'GREEN' ? 0.9 : rating === 'YELLOW' ? 0.6 : rating === 'RED' ? 0.3 : 0.5
  const offset = circumference * (1 - pct)
  return (
    <div style={{ position: 'relative', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="9" />
        <circle
          cx="65" cy="65" r={radius} fill="none"
          stroke={cfg.color} strokeWidth="9"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <p style={{ fontSize: 20, fontWeight: 800, color: cfg.color, margin: 0 }}>{cfg.label}</p>
        <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>Kalite Puanı</p>
      </div>
    </div>
  )
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return `${Math.floor(diff / 1000)} saniye önce`
  if (diff < 3600000) return `${Math.floor(diff / 60000)} dakika önce`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} saat önce`
  return `${Math.floor(diff / 86400000)} gün önce`
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

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reconnecting, setReconnecting] = useState(false)
  const [showTokenForm, setShowTokenForm] = useState(false)
  const [newToken, setNewToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [tokenSaving, setTokenSaving] = useState(false)
  const [tokenError, setTokenError] = useState<string | null>(null)
  const [tokenSuccess, setTokenSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp/health')
      if (res.ok) {
        const d = await res.json()
        setHealth(d.health ?? null)
      }
    } catch { /* ignore */ } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleReconnect() {
    setReconnecting(true)
    try {
      await fetch('/api/whatsapp/disconnect', { method: 'POST' })
      window.location.href = '/whatsapp/connection'
    } catch { /* ignore */ } finally { setReconnecting(false) }
  }

  async function handleTokenUpdate() {
    if (!health?.accountId || !newToken.trim()) return
    setTokenSaving(true)
    setTokenError(null)
    setTokenSuccess(false)
    try {
      const res = await fetch(`/api/whatsapp/accounts/${health.accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: newToken.trim() }),
      })
      if (res.ok) {
        setTokenSuccess(true)
        setNewToken('')
        setShowTokenForm(false)
        await load()
      } else {
        const d = await res.json() as { error?: string }
        setTokenError(d.error ?? 'Token güncellenemedi.')
      }
    } catch {
      setTokenError('Sunucuya ulaşılamadı.')
    } finally {
      setTokenSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <Loader2 size={22} className="animate-spin" style={{ color: '#16A34A' }} />
      </div>
    )
  }

  if (!health) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 12 }}>
        <WifiOff size={36} style={{ color: '#D1D5DB' }} />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', margin: 0 }}>WhatsApp bağlı değil</p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Hesabınızı bağlamak için kurulum sihirbazını kullanın</p>
        <a href="/whatsapp/connection" style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginTop: 4 }}>
          Bağlantı Kur
        </a>
      </div>
    )
  }

  const tierPct = health.messagingTierLimit > 0 ? (health.messagingTierUsed / health.messagingTierLimit) * 100 : 0
  const webhookAge = health.lastWebhookAt ? Date.now() - new Date(health.lastWebhookAt).getTime() : Infinity
  const webhookStale = webhookAge > 3600000 * 6
  const cfg = QUALITY_CONFIG[health.qualityRating] ?? QUALITY_CONFIG.UNKNOWN

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Hesap Sağlığı</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>WhatsApp Business API bağlantı durumu</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Yenile
        </button>
      </div>

      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip icon="monitor_heart" value={health.connectionStatus === 'connected' ? 'Bağlı' : 'Bağlı Değil'} label="durum" color={health.connectionStatus === 'connected' ? '#16A34A' : '#DC2626'} />
        <StatChip icon="star" value={cfg.label} label="kalite" color={cfg.color} />
        <StatChip icon="send" value={health.messagingTierUsed} label={`/ ${health.messagingTierLimit} günlük`} color="#2563EB" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Quality + info card */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <CircularGauge rating={health.qualityRating} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8 }}>{cfg.label}</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{cfg.desc}</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>Bağlı Numara</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 2px' }}>{health.phoneNumber ?? '—'}</p>
            {health.displayName && <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>{health.displayName}</p>}
            {health.verifiedName && health.verifiedName !== health.displayName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={12} style={{ color: '#16A34A' }} />
                <span style={{ fontSize: 12, color: '#16A34A' }}>Doğrulanmış: {health.verifiedName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Messaging tier */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Günlük Mesaj Limiti</p>
            <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{health.messagingTierUsed} / {health.messagingTierLimit} kullanıldı</p>
          </div>
          <div style={{ width: '100%', height: 8, background: '#F3F4F6', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8,
              width: `${Math.min(tierPct, 100)}%`,
              background: tierPct > 80 ? '#DC2626' : tierPct > 60 ? '#D97706' : '#16A34A',
              transition: 'width 1s ease',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{health.messagingTierLimit - health.messagingTierUsed} mesaj kaldı</span>
            {tierPct > 80 && <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>Limite yaklaşıyorsunuz</span>}
          </div>
        </div>

        {/* Webhook health */}
        <div style={{ background: webhookStale ? '#FFFBEB' : '#FFFFFF', border: `1px solid ${webhookStale ? '#FDE68A' : '#E5E7EB'}`, borderRadius: 10, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Webhook Durumu</p>
            {webhookStale ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D97706' }}>
                <AlertTriangle size={13} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>Uzun süredir sinyal yok</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16A34A' }}>
                <CheckCircle2 size={13} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>Normal</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '6px 0 0' }}>
            Son sinyal: {health.lastWebhookAt ? relTime(health.lastWebhookAt) : 'Hiç sinyal gelmedi'}
          </p>
          {webhookStale && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FDE68A' }}>
              <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
                Webhook&apos;ta sorun olabilir. Meta panelinden webhook URL&apos;ini kontrol edin veya bağlantıyı yenileyin.
              </p>
            </div>
          )}
        </div>

        {/* Token güncelle */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showTokenForm ? 14 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Key size={14} style={{ color: '#6B7280' }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Erişim Token&apos;ı</p>
            </div>
            <button
              onClick={() => { setShowTokenForm(p => !p); setTokenError(null); setTokenSuccess(false) }}
              style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#374151' }}
            >
              {showTokenForm ? 'İptal' : 'Token Güncelle'}
            </button>
          </div>

          {tokenSuccess && !showTokenForm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <CheckCircle2 size={13} style={{ color: '#16A34A' }} />
              <span style={{ fontSize: 12, color: '#16A34A', fontWeight: 500 }}>Token başarıyla güncellendi.</span>
            </div>
          )}

          {showTokenForm && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                Meta Business Manager&apos;dan yeni bir System User Token oluşturup buraya yapıştırın. Token önce Meta API&apos;ye karşı doğrulanır.
              </p>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={newToken}
                  onChange={e => setNewToken(e.target.value)}
                  placeholder="EAABcde..."
                  style={{ width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '9px 40px 9px 12px', fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box' }}
                />
                <button
                  onClick={() => setShowToken(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {tokenError && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 7, padding: '8px 12px' }}>
                  <AlertTriangle size={13} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#991B1B' }}>{tokenError}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleTokenUpdate}
                  disabled={tokenSaving || !newToken.trim()}
                  style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: (tokenSaving || !newToken.trim()) ? 0.6 : 1 }}
                >
                  {tokenSaving ? <Loader2 size={13} className="animate-spin" /> : <Key size={13} />}
                  {tokenSaving ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Token invalid / reconnect */}
        {(!health.hasMetaToken || health.connectionStatus === 'error') && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <AlertTriangle size={16} style={{ color: '#DC2626', marginTop: 1, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Token Geçersiz veya Süresi Dolmuş</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px' }}>
                  Meta API token&apos;ınız artık çalışmıyor. Yeni bir System User Token oluşturup bağlantıyı yenileyin.
                </p>
                <button
                  onClick={handleReconnect}
                  disabled={reconnecting}
                  style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: reconnecting ? 0.7 : 1 }}
                >
                  {reconnecting ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  Yeniden Bağlan
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
