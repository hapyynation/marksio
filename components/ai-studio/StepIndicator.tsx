'use client'

import { Check } from 'lucide-react'

const STEPS = [
  { key: 'upload',     label: 'Yükle' },
  { key: 'analyzing',  label: 'Analiz' },
  { key: 'editing',    label: 'Düzenle' },
  { key: 'generating', label: 'Üret' },
  { key: 'preview',    label: 'Önizle' },
  { key: 'saved',      label: 'Kaydet' },
] as const

type StudioStep = typeof STEPS[number]['key']

const ORDER: StudioStep[] = ['upload', 'analyzing', 'editing', 'generating', 'preview', 'saved']

export function StepIndicator({ current }: { current: StudioStep }) {
  const currentIdx = ORDER.indexOf(current)

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, idx) => {
        const done    = idx < currentIdx
        const active  = idx === currentIdx
        const pending = idx > currentIdx

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all text-[11px] font-bold"
                style={{
                  background: done ? '#9c40ff' : active ? '#6c47ff' : '#1e1e2e',
                  border: `2px solid ${done ? '#9c40ff' : active ? '#6c47ff' : '#2d2d3e'}`,
                  color: done || active ? '#fff' : '#6b7280',
                  boxShadow: active ? '0 0 0 4px rgba(108,71,255,0.18)' : 'none',
                }}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <span>{idx + 1}</span>}
              </div>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: done ? '#9c40ff' : active ? '#6c47ff' : '#6b7280' }}
              >
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 mt-[-10px] transition-all"
                style={{ background: idx < currentIdx ? '#9c40ff' : '#1e1e2e' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
