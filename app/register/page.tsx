'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Sparkles, Eye, EyeOff, Loader2, Check } from 'lucide-react'

const perks = [
  '14 gün ücretsiz, kredi kartı gerekmez',
  'Shopify & WooCommerce entegrasyonu',
  'AI ile kampanya oluşturucu',
  'Kurulum desteği dahil',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', storeName: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) { setError('Lütfen tüm zorunlu alanları doldurun.'); return }
    if (form.password.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return }

    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, storeName: form.storeName || 'Mağazam' }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Kayıt hatası oluştu.')
      setLoading(false)
      return
    }

    const result = await signIn('credentials', { email: form.email, password: form.password, redirect: false })
    setLoading(false)
    if (result?.ok) router.push('/onboarding')
    else setError('Hesap oluşturuldu fakat giriş yapılamadı. Lütfen giriş sayfasını deneyin.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex">
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-violet-600 to-purple-700 flex-col justify-between p-12 text-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl">Marksio</span>
        </Link>

        <div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">14 gün ücretsiz<br />deneyin</h2>
          <p className="text-violet-200 text-base leading-relaxed mb-8">Kayıt olduğunuz anda başlayın. Kredi kartı gerekmez.</p>
          <div className="space-y-3">
            {perks.map((p) => (
              <div key={p} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-violet-100 text-sm">{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">AK</div>
            <div>
              <p className="text-sm font-semibold">Ayşe Kara</p>
              <p className="text-xs text-violet-300">ModaKara.com</p>
            </div>
          </div>
          <p className="text-violet-100 text-sm italic leading-relaxed">
            &ldquo;İlk ayda ₺45.000 ek gelir elde ettik. Marksio olmadan bu imkansızdı.&rdquo;
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">Marksio</span>
          </Link>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Hesap oluşturun</h1>
              <p className="text-gray-500 text-sm">14 gün boyunca tüm özellikler ücretsiz</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ad Soyad <span className="text-red-400">*</span></label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Adınız"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mağaza Adı</label>
                  <input type="text" value={form.storeName} onChange={set('storeName')} placeholder="Mağazam"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-400">*</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="siz@magaza.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre <span className="text-red-400">*</span></label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="En az 8 karakter"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-sm pr-11" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {form.password && (
                  <div className="flex gap-1 mt-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                        form.password.length > i * 3 + 3
                          ? form.password.length >= 12 ? 'bg-emerald-400' : form.password.length >= 8 ? 'bg-amber-400' : 'bg-red-400'
                          : 'bg-gray-100'
                      }`} />
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Hesap oluşturuluyor...</> : 'Ücretsiz Başla'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-violet-600 font-semibold hover:text-violet-700">Giriş yapın</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
