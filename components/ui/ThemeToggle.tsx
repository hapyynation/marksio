'use client'
import { useTheme, type ThemeMode } from '@/components/providers/ThemeProvider'

const MODES: { mode: ThemeMode; icon: string; label: string }[] = [
  { mode: 'light',  icon: 'light_mode',       label: 'Açık'   },
  { mode: 'dark',   icon: 'dark_mode',         label: 'Koyu'   },
  { mode: 'system', icon: 'brightness_auto',   label: 'Sistem' },
]

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented'
  className?: string
}

export default function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { mode, setTheme } = useTheme()

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex rounded-lg p-0.5 ${className}`}
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        role="group"
        aria-label="Tema seçimi"
      >
        {MODES.map(({ mode: m, icon, label }) => {
          const active = mode === m
          return (
            <button
              key={m}
              onClick={() => setTheme(m)}
              title={label}
              aria-pressed={active}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2"
              style={{
                background: active ? 'var(--bg-card)' : 'transparent',
                color: active ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                border: active ? '1px solid var(--border)' : '1px solid transparent',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  const current = MODES.find(m => m.mode === mode) ?? MODES[2]
  return (
    <button
      onClick={() => setTheme(mode === 'light' ? 'dark' : mode === 'dark' ? 'system' : 'light')}
      title={`Tema: ${current.label}`}
      className={`flex items-center justify-center rounded-lg transition-colors hover:bg-s2 focus-visible:outline-none focus-visible:ring-2 ${className}`}
      style={{ width: 32, height: 32 }}
      aria-label="Tema değiştir"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-2)' }}>
        {current.icon}
      </span>
    </button>
  )
}
