'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName]       = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError]     = useState('')

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
          name:    trimmed,
          type:    'email',
          status:  'draft',
          segment: 'all',
          body:    '',
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
      <div className="flex-1 flex flex-col bg-[#F9FAFB]">
        {/* Header */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 h-14 flex items-center gap-3">
          <Link
            href="/campaigns"
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-[15px] font-semibold text-[#111827]">Yeni Kampanya</h1>
        </div>

        {/* Center form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
              <h2 className="text-[22px] font-bold text-[#111827] mb-1">Kampanya Oluştur</h2>
              <p className="text-[13px] text-[#6B7280] mb-6">Kampanyanıza bir isim verin ve düzenlemeye başlayın</p>

              <label className="block text-[12px] font-semibold text-[#374151] mb-2">Kampanya Adı</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Örn: Yaz İndirimi 2026"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E7EB] text-[14px] text-[#111827] placeholder:text-[#D1D5DB] outline-none focus:border-[#2563EB] transition-colors mb-4"
              />

              {error && (
                <p className="text-[12px] text-[#EF4444] mb-4">{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={!name.trim() || creating}
                className="w-full py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: '#16A34A' }}
              >
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Oluşturuluyor...</>
                  : 'Kampanya Oluştur →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
