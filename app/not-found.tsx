import Link from 'next/link'
import { Zap, LayoutDashboard, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="auth-page dot-bg items-center justify-center">
      <div className="auth-bg-orb-1" />
      <div className="auth-bg-orb-2" />

      <div className="relative z-10 text-center max-w-md px-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="btn-gradient w-8 h-8 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-black" style={{ color: '#e5e2e1' }}>Marksio</span>
        </div>

        {/* 404 number */}
        <div className="relative mb-6">
          <p className="text-[120px] font-black leading-none select-none ai-gradient-text opacity-20">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[120px] font-black leading-none select-none ai-gradient-text">404</p>
          </div>
        </div>

        <h1 className="text-2xl font-black mb-3" style={{ color: '#e5e2e1' }}>Sayfa bulunamadı</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: '#8c90a1' }}>
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard&apos;a Dön
          </Link>
          <Link href="https://marksio.com" className="btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Git
          </Link>
        </div>
      </div>
    </div>
  )
}
