'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/app/campaigns/[id]/page'

interface Segment {
  id: string
  name: string
  customerCount?: number
}

export function OptionsPanel({
  campaign,
  onUpdate,
}: {
  campaign: Campaign
  onUpdate: (fields: Partial<Campaign>) => Promise<void>
}) {
  const [segments, setSegments]         = useState<Segment[]>([])
  const [segsLoading, setSegsLoading]   = useState(true)
  const [selectedSeg, setSelectedSeg]   = useState(campaign.segment ?? 'all')
  const [trackOpens, setTrackOpens]     = useState(true)
  const [trackClicks, setTrackClicks]   = useState(true)
  const [dailyLimit, setDailyLimit]     = useState(500)
  const [showSegDD, setShowSegDD]       = useState(false)
  const [saving, setSaving]             = useState(false)
  const [saved, setSaved]               = useState(false)

  useEffect(() => {
    fetch('/api/segments')
      .then(r => r.json())
      .then(d => {
        // API may return array or { segments: [] }
        const arr: Segment[] = Array.isArray(d) ? d : (d.segments ?? [])
        setSegments(arr)
        setSegsLoading(false)
      })
      .catch(() => setSegsLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await onUpdate({ segment: selectedSeg })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const allSegments: Segment[] = [
    { id: 'all', name: 'Tüm Müşteriler' },
    ...segments,
  ]

  const activeSeg = allSegments.find(s => s.id === selectedSeg || s.name === selectedSeg)

  return (
    <div className="flex min-h-0" style={{ height: 'calc(100vh - 112px)' }}>

      {/* Left panel */}
      <div className="w-80 shrink-0 border-r border-[#E5E7EB] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Ayarlar</p>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-5">

          {/* Segment */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-2">Hedef Segment</label>
            <div className="relative">
              <button
                onClick={() => setShowSegDD(p => !p)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[13px] text-[#111827] hover:border-[#2563EB] transition-colors"
              >
                <span>{segsLoading ? 'Yükleniyor…' : (activeSeg?.name ?? 'Tüm Müşteriler')}</span>
                <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
              </button>
              {showSegDD && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSegDD(false)} />
                  <div className="absolute left-0 top-full mt-1 w-full bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 max-h-56 overflow-auto py-1">
                    {allSegments.map(seg => (
                      <button
                        key={seg.id}
                        onClick={() => { setSelectedSeg(seg.id === 'all' ? 'all' : seg.name); setShowSegDD(false) }}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-2.5 text-[13px] text-left hover:bg-[#F9FAFB] transition-colors',
                          (selectedSeg === seg.id || selectedSeg === seg.name) ? 'text-[#2563EB] font-medium' : 'text-[#374151]',
                        )}
                      >
                        <span>{seg.name}</span>
                        <div className="flex items-center gap-2">
                          {seg.customerCount != null && (
                            <span className="text-[11px] text-[#9CA3AF]">{seg.customerCount.toLocaleString('tr')}</span>
                          )}
                          {(selectedSeg === seg.id || selectedSeg === seg.name) && (
                            <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tracking */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-3">Takip Ayarları</label>
            <div className="space-y-2.5">
              {[
                { label: 'Açılma Takibi', desc: 'E-posta açıldığında bildirim al', value: trackOpens, set: setTrackOpens },
                { label: 'Tıklama Takibi', desc: 'Link tıklamalarını takip et', value: trackClicks, set: setTrackClicks },
              ].map(({ label, desc, value, set }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors cursor-pointer"
                  onClick={() => set(p => !p)}
                >
                  <div>
                    <p className="text-[13px] font-medium text-[#111827]">{label}</p>
                    <p className="text-[11px] text-[#9CA3AF]">{desc}</p>
                  </div>
                  <div
                    className={cn(
                      'w-10 h-6 rounded-full relative transition-colors',
                      value ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]',
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all',
                        value ? 'left-5' : 'left-1',
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily limit */}
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-2">Günlük Gönderim Limiti</label>
            <input
              type="number"
              value={dailyLimit}
              onChange={e => setDailyLimit(Math.max(1, Number(e.target.value)))}
              min={1}
              max={10000}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB] transition-colors"
            />
            <p className="text-[11px] text-[#9CA3AF] mt-1.5">Plan limitinize bağlı olarak değişebilir</p>
          </div>
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            style={{ background: '#2563EB' }}
          >
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor</>
              : saved
                ? <><Check className="w-3.5 h-3.5" /> Kaydedildi</>
                : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>

      {/* Right: info */}
      <div className="flex-1 p-6">
        <div className="max-w-md space-y-4">
          <div className="p-4 bg-white rounded-xl border border-[#E5E7EB]">
            <p className="text-[12px] font-semibold text-[#374151] mb-3">Kampanya Özeti</p>
            <div className="space-y-2.5">
              {[
                { label: 'Kampanya Adı', value: campaign.name },
                { label: 'Tür', value: campaign.type === 'email' ? 'E-posta' : campaign.type },
                { label: 'Segment', value: activeSeg?.name ?? selectedSeg },
                { label: 'Durum', value: campaign.status },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[#9CA3AF]">{label}</span>
                  <span className="text-[12px] font-medium text-[#374151] capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-[#FEF9EE] rounded-xl border border-[#FDE68A]">
            <p className="text-[12px] font-semibold text-[#92400E] mb-1">Gönderim İpucu</p>
            <p className="text-[11px] text-[#B45309] leading-relaxed">
              Günlük limiti plan kotanızın %80&apos;i ile sınırlı tutmanız domain itibarını korur ve spam klasörünü önler.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
