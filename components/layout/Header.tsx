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
  { id: 1, icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.08)', title: 'Anneler Günü kampanyası tamamlandı', desc: '₺24.680 gelir · %70 açılma oranı', time: '2 saat önce', read: false },
  { id: 2, icon: TrendingUp,  color: '#b3c5ff', bg: 'rgba(179,197,255,0.08)', title: 'Sepet terk otomasyonu bugün 48 tetiklendi', desc: '12 dönüşüm · ₺2.840 gelir', time: '5 saat önce', read: false },
  { id: 3, icon: AlertCircle, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', title: '3 yeni VIP müşteri tespit edildi', desc: 'Segmentasyonu güncellemek ister misiniz?', time: 'Dün', read: false },
  { id: 4, icon: Calendar,    color: '#00f1fe', bg: 'rgba(0,241,254,0.08)', title: 'Win-Back kampanyası yarın gönderilecek', desc: '620 müşteriye · Email kanalı', time: 'Dün', read: true },
  { id: 5, icon: CheckCircle, color: '#34d399', bg: 'rgba(52,211,153,0.08)', title: 'WhatsApp Business bağlantısı doğrulandı', desc: 'Mesaj göndermeye hazırsınız', time: '2 gün önce', read: true },
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

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="h-16 flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-20"
      style={{
        background: 'rgba(19,19,19,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.02)',
      }}>

      <button onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg transition-colors"
        style={{ color: '#8c90a1' }}>
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold truncate" style={{ color: '#e5e2e1', fontFamily: 'Inter, sans-serif' }}>{title}</h1>
          {subtitle && (
            <span className="hidden sm:block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
              style={{ background: '#2a2a2a', color: '#8c90a1' }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#424656' }} />
          <input
            type="text"
            placeholder="Ara..."
            className="pl-9 pr-4 py-2 text-xs rounded-xl w-44 outline-none transition-all"
            style={{
              background: '#131313',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#e5e2e1',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'rgba(0,241,254,0.3)'
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,241,254,0.06)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl transition-colors"
            style={{ color: '#8c90a1' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>notifications</span>
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5"
                style={{ background: '#00f1fe', boxShadow: '0 0 8px rgba(0,241,254,0.5)', color: '#001a1b' }}>
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl z-50 overflow-hidden"
              style={{
                background: 'rgba(19,19,19,0.97)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
              }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: '#e5e2e1' }}>Bildirimler</span>
                  {unread > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(0,241,254,0.15)', color: '#00f1fe', border: '1px solid rgba(0,241,254,0.2)' }}>
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead}
                      className="text-[10px] font-semibold transition-colors"
                      style={{ color: '#00f1fe' }}>
                      Tümünü oku
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)}
                    className="p-1 rounded-lg transition-colors"
                    style={{ color: '#8c90a1' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.03]">
                {notifs.map(n => (
                  <div key={n.id}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      background: !n.read ? 'rgba(0,241,254,0.02)' : 'transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                    onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseOut={e => (e.currentTarget.style.background = !n.read ? 'rgba(0,241,254,0.02)' : 'transparent')}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: n.bg }}>
                      <n.icon className="w-4 h-4" style={{ color: n.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug"
                        style={{ color: n.read ? '#8c90a1' : '#e5e2e1', fontWeight: n.read ? 400 : 600 }}>
                        {n.title}
                      </p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: '#8c90a1' }}>{n.desc}</p>
                      <p className="text-[9px] mt-1 font-medium uppercase tracking-wider" style={{ color: '#424656' }}>{n.time}</p>
                    </div>
                    {!n.read && (
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                        style={{ background: '#00f1fe', boxShadow: '0 0 6px rgba(0,241,254,0.5)' }} />
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            style={a.variant === 'secondary' ? {
              background: '#1c1b1b',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#8c90a1',
            } : {
              background: '#0066ff',
              color: '#fff',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 15px rgba(0,102,255,0.25)',
            }}>
            <Plus className="w-3.5 h-3.5" />
            {a.label}
          </Link>
        ))}
        {action && (
          <Link href={action.href}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: '#0066ff', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 0 15px rgba(0,102,255,0.25)' }}>
            <Plus className="w-3.5 h-3.5" />
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
