'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import DesignChatModal from '@/components/design/DesignChatModal'
import { ArrowLeft, Loader2, Wand2, Sparkles } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [designModalOpen, setDesignModalOpen] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState<{ url: string; id: string } | null>(null)

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          type: 'email',
          status: 'draft',
          segment: 'all',
          body: '',
          designImageUrl: selectedDesign?.url ?? undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        if (d.error === 'PLAN_LIMIT_REACHED') { router.push('/plans'); return }
        setError(d.error ?? 'Kampanya oluşturulamadı')
        return
      }
      const campaign = await res.json()
      router.push(`/campaigns/${campaign.id}?tab=sequences`)
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col" style={{ background: 'var(--bg)' }}>

        {/* Header */}
        <div className="h-14 flex items-center gap-3 px-4"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <Link href="/campaigns"
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Yeni Kampanya</h1>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full" style={{ maxWidth: 440 }}>

            {/* AI Design Card */}
            <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--surface)), color-mix(in srgb, var(--violet) 5%, var(--surface)))',
                border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
              }}
              onClick={() => setDesignModalOpen(true)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px color-mix(in srgb, var(--primary) 15%, transparent)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>

              {selectedDesign ? (
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedDesign.url} alt="Tasarım" className="w-16 h-10 rounded-lg object-cover shrink-0"
                    style={{ border: '1px solid var(--border)' }} />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 2 }}>
                      AI Tasarım Eklendi ✓
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      Değiştirmek için tıklayın
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--primary-soft)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}>
                    <Wand2 className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>AI ile Görsel Oluştur</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)', letterSpacing: '0.05em' }}>
                        YENİ
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-2)' }}>
                      Kampanyanızı tarif edin, saniyeler içinde profesyonel tasarım hazır
                    </p>
                  </div>
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: 'var(--primary)' }} />
                </div>
              )}
            </div>

            {/* Campaign Name Form */}
            <div className="rounded-2xl p-6"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.025em', marginBottom: 4 }}>
                Kampanya Oluştur
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
                Kampanyanıza bir isim verin ve düzenlemeye başlayın
              </p>

              <label className="label">Kampanya Adı</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Örn: Yaz İndirimi 2026"
                autoFocus
                className="input mb-4"
              />

              {error && (
                <p style={{ fontSize: 12, color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="w-full btn-primary justify-center py-2.5 text-[14px]">
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                  : 'Kampanya Oluştur →'
                }
              </button>
            </div>

          </div>
        </div>
      </div>

      <DesignChatModal
        open={designModalOpen}
        onClose={() => setDesignModalOpen(false)}
        onSelect={(url, id) => {
          setSelectedDesign({ url, id })
          setDesignModalOpen(false)
        }}
      />
    </AppShell>
  )
}
