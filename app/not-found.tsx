import Link from 'next/link'
import { Sparkles, ArrowLeft, LayoutDashboard } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-7 h-7 text-white" />
        </div>

        <div className="text-8xl font-black text-violet-100 mb-2 select-none leading-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sayfa bulunamadı</h1>
        <p className="text-gray-500 text-sm mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-3 rounded-xl transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard&apos;a Dön
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-5 py-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Ana Sayfaya Git
          </Link>
        </div>
      </div>
    </div>
  )
}
