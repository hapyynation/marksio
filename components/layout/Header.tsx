'use client'

import { useState, useRef, useEffect } from 'react'
import { CheckCircle, TrendingUp, AlertCircle, Calendar, X, Plus, Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { useSidebar } from '@/lib/sidebar-context'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
  actions?: { label: string; href: string; variant?: 'primary' | 'secondary' }[]
}

const notifications = [
  {
    id: 1, icon: CheckCircle, color: 'var(--green)', bg: 'rgba(34,201,122,0.08)',
    title: 'Anneler Günü kampanyası tamamlandı',
    desc: '₺24.680 gelir · %70 açılma oranı',
    time: '2s önce', read: false,
  },
  {
    id: 2, icon: TrendingUp, color: '#99b4ff', bg: 'rgba(68,112,255,0.08)',
    title: 'Sepet terk otomasyonu 48 tetiklendi',
    desc: '12 dönüşüm · ₺2.840 gelir',
    time: '5s önce', read: false,
  },
  {
    id: 3, icon: AlertCircle, color: 'var(--amber)', bg: 'rgba(240,160,32,0.08)',
    title: '3 yeni VIP müşteri tespit edildi',
    desc: 'Segmentasyonu güncellemek ister misiniz?',
    time: 'Dün', read: false,
  },
  {
    id: 4, icon: Calendar, color: '#00d8f0', bg: 'rgba(0,216,240,0.08)',
    title: 'Win-Back kampanyası yarın gönderilecek',
    desc: '620 müşteriye · Email kanalı',
    time: 'Dün', read: true,
  },
  {
    id: 5, icon: CheckCircle, color: 'var(--green)', bg: 'rgba(34,201,122,0.08)',
    title: 'WhatsApp Business bağlantısı doğrulandı',
    desc: 'Mesaj göndermeye hazırsınız',
    time: '2 gün', read: true,
  },
]

export default function Header({ title, subtitle, action, actions }: HeaderProps) {
  const { setOpen } = useSidebar()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState(notifications)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter(n => !n.read).length

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header
      className="h-14 flex items-center px-5 gap-3 sticky top-0 z-20"
      style={{
        background: 'rgba(11,11,20,0.9)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Mobile menu */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-2)' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-2)')}>
        <Menu className="w-4 h-4" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[14px] font-semibold truncate tracking-tight"
            style={{ color: '#eeeef4', letterSpacing: '-0.01em' }}>
            {title}
          </h1>
          {subtitle && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-2)',
              }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'var(--text-3)' }} />
          <input
            type="text"
            placeholder="Ara..."
            className="pl-9 pr-4 py-1.5 text-[13px] rounded-lg w-40 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#eeeef4',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(68,112,255,0.4)'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(68,112,255,0.08)'
              e.currentTarget.style.width = '200px'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.width = '160px'
            }}
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg transition-colors"
            style={{ color: showNotifs ? '#eeeef4' : 'var(--text-2)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#eeeef4')}
            onMouseLeave={e => !showNotifs && (e.currentTarget.style.color = 'var(--text-2)')}>
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>notifications</span>
            {unread > 0 && (
              <span
                className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                style={{ background: 'var(--blue)', color: '#fff', boxShadow: '0 0 6px rgba(68,112,255,0.5)' }}>
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              className="absolute right-0 top-full mt-2 w-[320px] rounded-2xl z-50 overflow-hidden animate-slide-up"
              style={{
                background: '#111120',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold" style={{ color: '#eeeef4' }}>
                    Bildirimler
                  </span>
                  {unread > 0 && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(68,112,255,0.15)',
                        color: '#99b4ff',
                        border: '1px solid rgba(68,112,255,0.2)',
                      }}>
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[11px] font-medium transition-colors"
                      style={{ color: 'var(--blue)' }}>
                      Tümü okundu
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)}
                    className="p-1 rounded-md transition-colors"
                    style={{ color: 'var(--text-2)' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="max-h-80 overflow-y-auto">
                {notifs.map((n, idx) => (
                  <div
                    key={n.id}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: !n.read ? 'rgba(68,112,255,0.03)' : 'transparent',
                      borderBottom: idx < notifs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = !n.read ? 'rgba(68,112,255,0.03)' : 'transparent')}
                    onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: n.bg }}>
                      <n.icon className="w-4 h-4" style={{ color: n.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug"
                        style={{ color: n.read ? 'var(--text-2)' : '#eeeef4', fontWeight: n.read ? 400 : 500 }}>
                        {n.title}
                      </p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-2)' }}>{n.desc}</p>
                      <p className="text-[10px] mt-1 font-medium" style={{ color: 'var(--text-3)' }}>{n.time}</p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: 'var(--blue)', boxShadow: '0 0 5px rgba(68,112,255,0.5)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {actions?.map(a => (
          <Link key={a.href} href={a.href}
            className={cn(
              'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all',
              a.variant === 'primary' ? 'btn-primary' : 'btn-secondary',
            )}>
            <Plus className="w-3.5 h-3.5" />
            {a.label}
          </Link>
        ))}
        {action && (
          <Link href={action.href}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-all btn-primary">
            <Plus className="w-3.5 h-3.5" />
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
