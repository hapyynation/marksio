'use client'

import { useState } from 'react'
import { Clock, Calendar, Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Campaign {
  scheduledAt?: string | null
}

const DAYS = [
  { key: 'mon', label: 'Pzt' },
  { key: 'tue', label: 'Sal' },
  { key: 'wed', label: 'Çar' },
  { key: 'thu', label: 'Per' },
  { key: 'fri', label: 'Cum' },
  { key: 'sat', label: 'Cmt' },
  { key: 'sun', label: 'Paz' },
]

export function SchedulePanel({ campaign, onUpdate, onLaunch }: {
  campaign: Campaign
  onUpdate: (fields: { scheduledAt?: string | null | undefined }) => Promise<void>
  onLaunch?: () => void
}) {
  const [timing, setTiming]             = useState<'now' | 'scheduled'>(campaign.scheduledAt ? 'scheduled' : 'now')
  const [scheduledDate, setScheduledDate] = useState(
    campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().split('T')[0] : ''
  )
  const [scheduledTime, setScheduledTime] = useState(
    campaign.scheduledAt
      ? new Date(campaign.scheduledAt).toTimeString().slice(0, 5)
      : '10:00'
  )
  const [activeDays, setActiveDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
  const [fromTime, setFromTime]     = useState('09:00')
  const [toTime, setToTime]         = useState('17:00')
  const [saving, setSaving]         = useState(false)
  const [saved, setSaved]           = useState(false)

  const toggleDay = (day: string) =>
    setActiveDays(p => p.includes(day) ? p.filter(d => d !== day) : [...p, day])

  const handleSave = async () => {
    setSaving(true)
    if (timing === 'now') {
      await onUpdate({ scheduledAt: null })
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      onLaunch?.()
      return
    }
    const scheduledAt = scheduledDate
      ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
      : null
    await onUpdate({ scheduledAt })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex h-full min-h-0" style={{ height: 'calc(100vh - 112px)' }}>

      {/* Left panel */}
      <div className="w-80 shrink-0 border-r border-[#E5E7EB] bg-white flex flex-col">
        <div className="px-4 py-3 border-b border-[#E5E7EB]">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Zamanlama</p>
        </div>

        <div className="flex-1 p-4 space-y-2.5">
          <button
            onClick={() => setTiming('now')}
            className={cn(
              'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
              timing === 'now' ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E5E7EB] hover:border-[#D1D5DB] bg-white',
            )}
          >
            <Clock className="w-4 h-4 shrink-0" style={{ color: timing === 'now' ? '#2563EB' : '#9CA3AF' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: timing === 'now' ? '#2563EB' : '#374151' }}>Şimdi Başlat</p>
              <p className="text-[11px] text-[#9CA3AF]">Kampanya hemen gönderilir</p>
            </div>
            {timing === 'now' && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
          </button>

          <button
            onClick={() => setTiming('scheduled')}
            className={cn(
              'w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all',
              timing === 'scheduled' ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E5E7EB] hover:border-[#D1D5DB] bg-white',
            )}
          >
            <Calendar className="w-4 h-4 shrink-0" style={{ color: timing === 'scheduled' ? '#2563EB' : '#9CA3AF' }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold" style={{ color: timing === 'scheduled' ? '#2563EB' : '#374151' }}>Zamanla</p>
              <p className="text-[11px] text-[#9CA3AF] truncate">
                {scheduledDate ? `${scheduledDate} ${scheduledTime}` : 'Tarih seç'}
              </p>
            </div>
            {timing === 'scheduled' && <Check className="w-4 h-4 text-[#2563EB] shrink-0" />}
          </button>
        </div>

        <div className="p-4 border-t border-[#E5E7EB]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            style={{ background: '#16A34A' }}
          >
            {saving
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Kaydediliyor</>
              : saved
                ? <><Check className="w-3.5 h-3.5" /> Kaydedildi</>
                : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 overflow-auto p-6">
        {timing === 'scheduled' ? (
          <div className="max-w-md space-y-5">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-2">Gönderim Tarihi</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-2">Gönderim Saati</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-2">Zaman Dilimi</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB]">
                <option>Europe/Istanbul (UTC+3)</option>
                <option>UTC</option>
                <option>Europe/London (UTC+0)</option>
              </select>
            </div>

            <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE]">
              <p className="text-[12px] font-semibold text-[#1D4ED8] mb-1">Önerilen Gönderim Zamanı</p>
              <p className="text-[11px] text-[#3B82F6] leading-relaxed">
                Salı–Perşembe arası 10:00–11:00 veya 14:00–15:00 saatleri en yüksek açılma oranı sağlar.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-md space-y-5">
            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-3">Gönderim Saatleri</label>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#9CA3AF] mb-1.5">Başlangıç</label>
                  <input
                    type="time"
                    value={fromTime}
                    onChange={e => setFromTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB]"
                  />
                </div>
                <span className="text-[#9CA3AF] pb-2.5">—</span>
                <div className="flex-1">
                  <label className="block text-[11px] text-[#9CA3AF] mb-1.5">Bitiş</label>
                  <input
                    type="time"
                    value={toTime}
                    onChange={e => setToTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-3">Gönderim Günleri</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => toggleDay(d.key)}
                    className={cn(
                      'w-11 h-11 rounded-xl text-[12px] font-semibold border transition-all',
                      activeDays.includes(d.key)
                        ? 'bg-[#2563EB] border-[#2563EB] text-white'
                        : 'bg-white border-[#E5E7EB] text-[#6B7280] hover:border-[#2563EB] hover:text-[#2563EB]',
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#374151] mb-2">Zaman Dilimi</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-[#E5E7EB] text-[13px] text-[#111827] bg-white outline-none focus:border-[#2563EB]">
                <option>Europe/Istanbul (UTC+3)</option>
                <option>UTC</option>
                <option>Europe/London (UTC+0)</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
