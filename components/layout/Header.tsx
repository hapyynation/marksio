'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Search, Plus, Menu, CheckCircle, TrendingUp, AlertCircle, Calendar, X } from 'lucide-react'
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
  { id: 1, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10', title: 'Anneler Günü kampanyası tamamlandı', desc: '₺24.680 gelir · %70 açılma oranı', time: '2 saat önce', read: false },
  { id: 2, icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10', title: 'Sepet terk otomasyonu bugün 48 tetiklendi', desc: '12 dönüşüm · ₺2.840 gelir', time: '5 saat önce', read: false },
  { id: 3, icon: AlertCircle, color: 'text-amber-400 bg-amber-500/10', title: '3 yeni VIP müşteri tespit edildi', desc: 'Segmentasyonu güncellemek ister misiniz?', time: 'Dün', read: false },
  { id: 4, icon: Calendar, color: 'text-blue-400 bg-blue-500/10', title: 'Win-Back kampanyası yarın gönderilecek', desc: '620 müşteriye · Email kanalı', time: 'Dün', read: true },
  { id: 5, icon: CheckCircle, color: 'text-emerald-400 bg-emerald-500/10', title: 'WhatsApp Business bağlantısı doğrulandı', desc: 'Mesaj göndermeye hazırsınız', time: '2 gün önce', read: true },
]

export default function Header({ title, subtitle, action, actions }: HeaderProps) {
  const { setOpen } = useSidebar()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs] = useState(notifications)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifs.filter((n) => !n.read).length

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowNotifs(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="h-14 bg-[#0d0d0d] border-b border-[#1e1e1e] flex items-center px-4 lg:px-6 gap-3 sticky top-0 z-20">
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a] rounded-lg transition"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-white truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 hidden sm:block">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
          <input
            type="text"
            placeholder="Ara..."
            className="pl-8 pr-4 py-1.5 text-sm bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-300 placeholder-gray-600 w-44 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition"
          />
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-gray-600 hover:text-gray-300 hover:bg-[#1a1a1a] rounded-lg transition"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {unread}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#111] rounded-xl shadow-2xl border border-[#222] z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
                <span className="text-sm font-semibold text-white">Bildirimler</span>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                      Tümünü oku
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-gray-600 hover:text-gray-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-[#1a1a1a] max-h-80 overflow-y-auto">
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className={cn('flex gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors cursor-pointer', !n.read && 'bg-blue-500/5')}
                    onClick={() => setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', n.color)}>
                      <n.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs leading-snug', n.read ? 'text-gray-500' : 'text-gray-200 font-medium')}>{n.title}</p>
                      <p className="text-[11px] text-gray-600 mt-0.5 truncate">{n.desc}</p>
                      <p className="text-[11px] text-gray-700 mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {actions?.map(a => (
          <Link key={a.href} href={a.href}
            className={cn('hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              a.variant === 'secondary'
                ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:border-[#333] hover:text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white')}>
            <Plus className="w-3.5 h-3.5" />
            {a.label}
          </Link>
        ))}
        {action && (
          <Link href={action.href} className="btn-primary hidden sm:flex">
            <Plus className="w-4 h-4" />
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
