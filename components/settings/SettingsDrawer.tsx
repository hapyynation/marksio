'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  X, User, CreditCard, Link2, Mail, MessageCircle,
  Sparkles, Bell, Users, Shield, AlertTriangle, ChevronRight,
} from 'lucide-react'
import { useSettingsDrawer } from '@/lib/settings-drawer-context'
import { useSession } from '@/lib/hooks/use-session'

interface Category {
  key: string
  label: string
  desc: string
  icon: React.ElementType
  iconColor: string
  iconBg: string
  wide?: boolean
  danger?: boolean
}

const CATEGORIES: Category[] = [
  {
    key: 'hesap', label: 'Hesap', desc: 'Profil ve mağaza bilgileri',
    icon: User, iconColor: 'var(--blue)', iconBg: 'var(--blue-soft)',
  },
  {
    key: 'billing', label: 'Plan & Faturalama', desc: 'Abonelik ve ödeme yönetimi',
    icon: CreditCard, iconColor: 'var(--violet)', iconBg: 'var(--violet-soft)',
  },
  {
    key: 'integrations', label: 'Entegrasyonlar', desc: 'Platform bağlantıları',
    icon: Link2, iconColor: '#f0a020', iconBg: 'rgba(240,160,32,0.12)',
  },
  {
    key: 'email', label: 'E-posta Gönderimi', desc: 'Domain ve gönderim ayarları',
    icon: Mail, iconColor: 'var(--green)', iconBg: 'var(--green-soft)',
  },
  {
    key: 'whatsapp', label: 'WhatsApp AI', desc: 'Bot yapılandırması',
    icon: MessageCircle, iconColor: '#25d366', iconBg: 'rgba(37,211,102,0.1)',
  },
  {
    key: 'ai-studio', label: 'AI Studio', desc: 'Marka kimliği ve görsel stili',
    icon: Sparkles, iconColor: 'var(--violet)', iconBg: 'var(--violet-soft)',
  },
  {
    key: 'notifications', label: 'Bildirimler', desc: 'Bildirim tercihleri',
    icon: Bell, iconColor: '#f0a020', iconBg: 'rgba(240,160,32,0.12)',
  },
  {
    key: 'team', label: 'Takım', desc: 'Üyeler ve yetkiler',
    icon: Users, iconColor: 'var(--blue)', iconBg: 'var(--blue-soft)',
  },
  {
    key: 'security', label: 'Güvenlik', desc: 'Şifre ve erişim kontrolü',
    icon: Shield, iconColor: 'var(--text-2)', iconBg: 'rgba(255,255,255,0.06)',
  },
  {
    key: 'danger', label: 'Tehlikeli Bölge', desc: 'Hesap silme ve dondurma',
    icon: AlertTriangle, iconColor: 'var(--red)', iconBg: 'var(--red-soft)',
    wide: true, danger: true,
  },
]

export default function SettingsDrawer() {
  const { isOpen, close } = useSettingsDrawer()
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as { name?: string; storeName?: string } | undefined
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? 'MA'

  function navigate(key: string) {
    close()
    router.push(`/settings?tab=${key}`)
  }

  const gridCats = CATEGORIES.filter(c => !c.wide)
  const wideCats  = CATEGORIES.filter(c => c.wide)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-40 cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)' }}
            onClick={close}
          />

          {/* Drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.9 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 420,
              background: 'linear-gradient(180deg, #0d0d1c 0%, #0a0a15 100%)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '-24px 0 80px rgba(0,0,0,0.7)',
            }}
          >
            {/* Header */}
            <div className="px-6 pt-7 pb-5 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--blue-soft)', border: '1px solid rgba(68,112,255,0.22)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--blue)', fontVariationSettings: "'FILL' 1" }}>
                      settings
                    </span>
                  </div>
                  <h2 className="text-[15px] font-bold" style={{ color: 'var(--text-1)', letterSpacing: '-0.025em' }}>
                    Ayarlar
                  </h2>
                </div>
                <button
                  onClick={close}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/[0.05]"
                  style={{ color: 'var(--text-3)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                Hesap, entegrasyon ve tercih yönetimi
              </p>
            </div>

            {/* User chip */}
            <div className="px-5 pb-4 shrink-0">
              <div
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                  style={{
                    background: 'var(--blue-soft)',
                    color: 'var(--blue)',
                    border: '1px solid rgba(68,112,255,0.25)',
                  }}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold truncate leading-tight" style={{ color: 'var(--text-1)' }}>
                    {user?.name ?? 'Kullanıcı'}
                  </p>
                  <p className="text-[11px] leading-tight truncate" style={{ color: 'var(--text-3)' }}>
                    {user?.storeName ?? 'Mağaza'}
                  </p>
                </div>
                <span className="chip chip-violet text-[10px] shrink-0">Growth</span>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-5 h-px shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* Scrollable category area */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-2.5">

              {/* Section label */}
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] px-0.5 pb-1"
                style={{ color: 'var(--text-3)' }}>
                Kategoriler
              </p>

              {/* 2-column grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {gridCats.map(cat => (
                  <CategoryCard key={cat.key} cat={cat} onClick={() => navigate(cat.key)} />
                ))}
              </div>

              {/* Wide danger card */}
              {wideCats.map(cat => (
                <WideCard key={cat.key} cat={cat} onClick={() => navigate(cat.key)} />
              ))}
            </div>

            {/* Footer */}
            <div
              className="px-5 py-4 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
            >
              <p className="text-[11px] text-center" style={{ color: 'var(--text-3)' }}>
                Marksio v2.4 · Growth Plan
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function CategoryCard({ cat, onClick }: { cat: Category; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left p-4 rounded-xl transition-all duration-150 focus:outline-none"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.065)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.045)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.065)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: cat.iconBg, border: `1px solid ${cat.iconColor}28` }}
        >
          <cat.icon className="w-3.5 h-3.5" style={{ color: cat.iconColor }} />
        </div>
        <ChevronRight
          className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-all duration-150"
          style={{ color: 'var(--text-3)' }}
        />
      </div>
      <p className="text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--text-1)' }}>
        {cat.label}
      </p>
      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--text-3)' }}>
        {cat.desc}
      </p>
    </button>
  )
}

function WideCard({ cat, onClick }: { cat: Category; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left px-4 py-3.5 rounded-xl transition-all duration-150 flex items-center gap-3 focus:outline-none"
      style={{
        background: 'rgba(232,69,69,0.04)',
        border: '1px solid rgba(232,69,69,0.1)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(232,69,69,0.08)'
        e.currentTarget.style.borderColor = 'rgba(232,69,69,0.18)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(232,69,69,0.04)'
        e.currentTarget.style.borderColor = 'rgba(232,69,69,0.1)'
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--red-soft)' }}
      >
        <cat.icon className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
      </div>
      <div className="flex-1 text-left">
        <p className="text-[12.5px] font-semibold" style={{ color: 'var(--red)' }}>{cat.label}</p>
        <p className="text-[11px]" style={{ color: 'rgba(232,69,69,0.55)' }}>{cat.desc}</p>
      </div>
      <ChevronRight
        className="w-3.5 h-3.5 opacity-0 group-hover:opacity-70 transition-opacity"
        style={{ color: 'var(--red)' }}
      />
    </button>
  )
}
