'use client'

import { X, Crown, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export interface PlanLimitData {
  error: string
  feature: string
  currentPlan: string
  requiredPlan: string
}

interface Props {
  data: PlanLimitData | null
  onClose: () => void
}

const PLAN_NAMES: Record<string, string> = {
  free:    'Ücretsiz',
  starter: 'Starter',
  growth:  'Growth',
  agency:  'Agency',
}

const FEATURE_LABELS: Record<string, string> = {
  automations: 'Otomasyonlar',
  campaigns:   'Kampanyalar',
  whatsapp:    'WhatsApp Gönderimi',
  aiStudio:    'AI Stüdyo',
  emailSends:  'E-posta Gönderimi',
}

export default function PlanLimitModal({ data, onClose }: Props) {
  if (!data) return null

  const planName    = PLAN_NAMES[data.requiredPlan] ?? data.requiredPlan
  const featureName = FEATURE_LABELS[data.feature]  ?? data.feature

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative max-w-sm w-full rounded-2xl p-6 shadow-2xl"
        style={{ background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:bg-white/[0.08]"
          style={{ color: '#8080a0' }}
        >
          <X className="w-4 h-4" />
        </button>

        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(240,160,32,0.12)', border: '1px solid rgba(240,160,32,0.2)' }}
        >
          <Crown className="w-6 h-6" style={{ color: '#f0a020' }} />
        </div>

        <h2 className="text-[17px] font-bold mb-2" style={{ color: '#eeeef4' }}>
          Plan Limiti Aşıldı
        </h2>
        <p className="text-[13px] leading-relaxed mb-1" style={{ color: '#8080a0' }}>
          <span style={{ color: '#eeeef4', fontWeight: 600 }}>{featureName}</span> özelliğini
          kullanmak için{' '}
          <span style={{ color: '#f0a020', fontWeight: 700 }}>{planName}</span> planına
          ihtiyacınız var.
        </p>
        <p className="text-[12px] mb-6" style={{ color: '#3e3e54' }}>
          Mevcut plan: {PLAN_NAMES[data.currentPlan] ?? data.currentPlan}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: '#8080a0',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Kapat
          </button>
          <Link
            href="/plans"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold"
            style={{ background: '#f0a020', color: '#fff' }}
          >
            Planını Yükselt <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
