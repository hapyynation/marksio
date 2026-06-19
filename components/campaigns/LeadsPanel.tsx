'use client'

import { useEffect, useState } from 'react'
import { Users, Loader2, AlertCircle, MoreHorizontal, Download, Trash2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Campaign } from '@/app/campaigns/[id]/page'

interface LeadRow {
  id: string
  name: string
  email: string
  segment: string
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'failed'
  sentAt: string | null
}

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: 'Bekliyor',    bg: '#F3F4F6', color: '#6B7280' },
  sent:    { label: 'Gönderildi', bg: '#DCFCE7', color: '#16A34A' },
  opened:  { label: 'Açıldı',     bg: '#EFF6FF', color: '#2563EB' },
  clicked: { label: 'Tıkladı',    bg: '#EDE9FE', color: '#7C3AED' },
  failed:  { label: 'Başarısız',  bg: '#FEE2E2', color: '#DC2626' },
}

const VARS = [
  { key: '{{name}}',    desc: 'Müşteri adı' },
  { key: '{{email}}',   desc: 'Müşteri e-postası' },
  { key: '{{segment}}', desc: 'Segment adı' },
]

export function LeadsPanel({ campaign }: { campaign: Campaign }) {
  const [leads, setLeads]         = useState<LeadRow[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [menuId, setMenuId]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/campaigns/${campaign.id}/recipients`)
      .then(r => r.json())
      .then(d => {
        setLeads(d.customers ?? [])
        setTotal(d.total ?? 0)
        setLoading(false)
      })
      .catch(() => {
        setError('Müşteriler yüklenemedi')
        setLoading(false)
      })
  }, [campaign.id])


  const allSelected  = leads.length > 0 && selected.size === leads.length
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(leads.map(l => l.id)))
  }

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const removeIds = async (ids: string[]) => {
    const res = await fetch(`/api/campaigns/${campaign.id}/recipients`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (res.ok) {
      setLeads(prev => prev.filter(l => !ids.includes(l.id)))
      setTotal(prev => prev - ids.length)
      setSelected(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next })
    }
    setMenuId(null)
  }

  const exportCsv = (rows: LeadRow[]) => {
    const header = 'İsim,E-posta,Segment,Durum,Gönderim'
    const lines = rows.map(r =>
      [r.name, r.email, r.segment, r.status, r.sentAt ?? ''].map(v => `"${v}"`).join(',')
    )
    const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `leads-${campaign.id}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
          <Users className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-[#111827]">Hedef Kitle</h3>
          {!loading && (
            <p className="text-[12px] text-[#6B7280]">
              {total > 0 ? `${total.toLocaleString('tr')} müşteri` : 'Henüz müşteri yok'}
              {total > 50 && ' (ilk 50 gösteriliyor)'}
            </p>
          )}
        </div>
      </div>

      {/* Variables info */}
      <div className="flex items-start gap-2.5 p-3.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl">
        <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-[#0369A1] mb-1">Email&apos;de kullanabileceğin değişkenler</p>
          <div className="flex flex-wrap gap-2">
            {VARS.map(v => (
              <span key={v.key} className="flex items-center gap-1 text-[11px] text-[#0369A1]">
                <code className="bg-[#BAE6FD] px-1.5 py-0.5 rounded font-mono">{v.key}</code>
                <span className="text-[#64748B]">— {v.desc}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl">
          <span className="text-[13px] font-semibold text-[#1D4ED8]">
            {selected.size} lead seçildi
          </span>
          <div className="flex-1" />
          <button
            onClick={() => exportCsv(leads.filter(l => selected.has(l.id)))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#BFDBFE] text-[12px] font-semibold text-[#2563EB] hover:bg-[#F0F9FF] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Dışa Aktar
          </button>
          <button
            onClick={() => removeIds(Array.from(selected))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[12px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kaldır
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-[#2563EB] animate-spin" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16 gap-2 text-[#EF4444]">
          <AlertCircle className="w-4 h-4" />
          <span className="text-[13px]">{error}</span>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <Users className="w-8 h-8 text-[#D1D5DB]" />
          <p className="text-[13px] font-semibold text-[#374151]">
            {campaign.segment && campaign.segment !== 'all'
              ? `"${campaign.segment}" segmentinde müşteri bulunamadı`
              : 'Henüz müşteri eklenmedi'}
          </p>
          <p className="text-[12px] text-[#9CA3AF]">Müşteri içe aktarın veya farklı bir segment seçin</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-[#D1D5DB] accent-[#2563EB] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">İsim</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">E-posta</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Segment</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Durum</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Gönderim</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead, i) => {
                const badge = STATUS_MAP[lead.status] ?? STATUS_MAP.pending
                const isSelected = selected.has(lead.id)
                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      'border-b border-[#E5E7EB] last:border-0 group',
                      isSelected ? 'bg-[#EFF6FF]' : i % 2 === 0 ? 'bg-white hover:bg-[#F9FAFB]' : 'bg-[#F9FAFB] hover:bg-[#F3F4F6]',
                    )}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(lead.id)}
                        className="w-4 h-4 rounded border-[#D1D5DB] accent-[#2563EB] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[11px] font-bold text-[#2563EB] shrink-0">
                          {(lead.name ?? '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium text-[#111827]">{lead.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#374151]">{lead.email}</td>
                    <td className="px-4 py-3">
                      {lead.segment ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F3F4F6] text-[#374151]">
                          {lead.segment}
                        </span>
                      ) : (
                        <span className="text-[12px] text-[#D1D5DB]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9CA3AF]">
                      {lead.sentAt
                        ? new Date(lead.sentAt).toLocaleDateString('tr', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3 relative">
                      <button
                        onClick={() => setMenuId(prev => prev === lead.id ? null : lead.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] transition-all"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      {menuId === lead.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuId(null)} />
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            <button
                              onClick={() => removeIds([lead.id])}
                              className="w-full px-3.5 py-2 text-left text-[12px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-3 h-3" />
                              Kaldır
                            </button>
                            <button
                              className="w-full px-3.5 py-2 text-left text-[12px] text-[#6B7280] opacity-50 cursor-not-allowed"
                              disabled
                            >
                              Yeniden Gönder
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
