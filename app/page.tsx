import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-options'
import Link from 'next/link'
import {
  Sparkles, Zap, Mail, MessageSquare, BarChart3,
  Users, ArrowRight, Check,
  ShoppingBag, Globe, RefreshCw,
} from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#09090b] text-white antialiased overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">Marksio</span>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-7 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#how" className="hover:text-white transition-colors">Nasıl Çalışır</a>
            <a href="#pricing" className="hover:text-white transition-colors">Fiyatlandırma</a>
            <a href="#integrations" className="hover:text-white transition-colors">Entegrasyonlar</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5">
              Giriş Yap
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 text-sm font-semibold bg-white text-[#09090b] hover:bg-white/90 px-4 py-1.5 rounded-lg transition-all"
            >
              Erken Erişim Al <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative pt-36 pb-28 px-6 text-center overflow-hidden">
        {/* Glow arka plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-1/4 w-64 h-64 bg-purple-700/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          {/* Beta badge */}
          <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Beta Programa Katılmak İçin Sınırlı Yer
          </div>

          <h1 className="text-5xl md:text-[64px] font-extrabold leading-[1.05] tracking-tight mb-6">
            E-ticaretinizi{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              hiç uyumayan
            </span>
            {' '}bir AI ile büyütün.
          </h1>

          <p className="text-lg md:text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Anında müşteri segmentasyonu, otomatik email & WhatsApp kampanyaları
            ve sepet terk kurtarma — ekibinizi büyütmeden.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-900/40 hover:-translate-y-0.5"
            >
              Beta Programına Katıl
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/8 text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl transition-all"
            >
              Giriş Yap
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-white/30">
            <div className="flex -space-x-2">
              {['AK', 'MY', 'FD', 'BÇ', 'EY'].map(a => (
                <div key={a} className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-purple-700 border-2 border-[#09090b] flex items-center justify-center text-[9px] font-bold text-white">
                  {a}
                </div>
              ))}
            </div>
            <span>500+ mağaza erken erişim bekleniyor</span>
          </div>
        </div>

        {/* Dashboard preview mock */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10 pointer-events-none rounded-2xl" style={{ top: '60%' }} />
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/60">
            {/* Tarayıcı chrome */}
            <div className="bg-white/[0.04] border-b border-white/[0.06] px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 mx-4 bg-white/5 border border-white/[0.06] rounded-md px-3 py-1 text-xs text-white/20 text-center">
                app.marksio.com/dashboard
              </div>
            </div>
            {/* Dashboard içerik */}
            <div className="p-5 bg-[#0f0f12]">
              <div className="grid grid-cols-4 gap-3 mb-4">
                {[
                  { label: 'Aylık Gelir', value: '₺284.920', trend: '+18%', color: 'text-violet-400' },
                  { label: 'Aktif Müşteri', value: '5.832', trend: '+12%', color: 'text-emerald-400' },
                  { label: 'Aktif Kampanya', value: '7', trend: '+3', color: 'text-blue-400' },
                  { label: 'Ort. Sipariş', value: '₺189', trend: '+8%', color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-3.5">
                    <p className="text-xs text-white/30 mb-1">{s.label}</p>
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className={`text-xs font-medium mt-0.5 ${s.color}`}>{s.trend}</p>
                  </div>
                ))}
              </div>
              {/* Bar chart mock */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-end gap-1.5 h-28">
                {[35, 58, 42, 75, 50, 88, 65, 82, 55, 92, 70, 100].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-sm bg-gradient-to-t from-violet-700 to-violet-500 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              {/* Müşteri listesi mock */}
              <div className="mt-3 bg-white/[0.03] border border-white/[0.06] rounded-xl divide-y divide-white/[0.04]">
                {[
                  { name: 'Ayşe Kara', tag: 'VIP', val: '₺4.280', color: 'bg-violet-500/20 text-violet-300' },
                  { name: 'Mehmet Yılmaz', tag: 'Sadık', val: '₺1.920', color: 'bg-blue-500/20 text-blue-300' },
                  { name: 'Fatma Demir', tag: 'Risk', val: '₺890', color: 'bg-amber-500/20 text-amber-300' },
                ].map(r => (
                  <div key={r.name} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white/50">
                        {r.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-white/70">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.color}`}>{r.tag}</span>
                      <span className="text-sm font-medium text-white/50">{r.val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Beta Başvurusu' },
            { value: '%340', label: 'Ortalama ROI Artışı' },
            { value: '%67', label: 'Müşteri Geri Dönüş Oranı' },
            { value: '3dk', label: 'Kampanya Oluşturma Süresi' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-sm text-white/30">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Özellikler ─────────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Özellikler</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">Her şey tek platformda</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">Dağınık araçlara son. Email, SMS, WhatsApp ve analitik tek panelden.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Sparkles, title: 'AI Kampanya Oluşturucu', desc: 'Hedef segmenti ve tonu belirleyin — AI saniyeler içinde e-posta, SMS ve WhatsApp içerikleri üretsin.', color: 'from-violet-500 to-purple-600' },
              { icon: Users, title: 'Akıllı Segmentasyon', desc: 'Müşterileriniz satın alma davranışına göre otomatik VIP, sadık, risk altında ve pasif segmentlerine ayrılır.', color: 'from-blue-500 to-cyan-600' },
              { icon: Zap, title: 'Otomasyon Akışları', desc: 'Sepet terk, hoş geldin, doğum günü akışlarını bir kez kur. Sistem 7/24 çalışır, siz uyurken bile.', color: 'from-amber-500 to-orange-500' },
              { icon: BarChart3, title: 'Gelir Analitiği', desc: 'Kampanya bazlı ROI, açılma oranları, dönüşüm takibi ve gerçek zamanlı gelir raporları.', color: 'from-emerald-500 to-teal-600' },
              { icon: MessageSquare, title: 'WhatsApp Otomasyonu', desc: 'Kişisel hissettiren mesajlarla %87 okunma oranı. Sepet terk ve sipariş bildirimlerini WhatsApp\'tan gönderin.', color: 'from-green-500 to-emerald-600' },
              { icon: RefreshCw, title: 'Shopify & İkas & WooCommerce', desc: 'Mağazanızla tek tıkla entegrasyon. Sipariş, müşteri ve ürün verileri otomatik senkronize.', color: 'from-indigo-500 to-violet-600' },
            ].map(f => (
              <div key={f.title} className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 transition-all hover:-translate-y-1">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ──────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Nasıl Çalışır</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">3 adımda başlayın</h2>
          </div>
          <div className="space-y-4">
            {[
              { step: '01', icon: Globe, title: 'Mağazanızı Bağlayın', desc: 'Shopify, İkas veya WooCommerce mağazanızı tek tıkla entegre edin. Müşteri, sipariş ve ürün verileri otomatik senkronize edilir.' },
              { step: '02', icon: Users, title: 'Segmentlerinizi Keşfedin', desc: 'AI, müşterilerinizi VIP, sadık, risk altında ve pasif olarak otomatik gruplandırır. Her segment için akıllı kampanya önerileri sunar.' },
              { step: '03', icon: BarChart3, title: 'Kampanyanızı Başlatın', desc: 'Email Builder\'da şablonu seçin, ürün görselini ekleyin, stil promptunu girin — AI profesyonel email\'i saniyeler içinde üretir.' },
            ].map(item => (
              <div key={item.step} className="flex gap-6 items-start bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.1] transition-all">
                <span className="text-4xl font-extrabold text-white/[0.06] shrink-0 w-14">{item.step}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-violet-400" />
                    <h3 className="font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Entegrasyonlar ─────────────────────────────────────────────── */}
      <section id="integrations" className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Entegrasyonlar</p>
          <h2 className="text-3xl font-extrabold text-white mb-10">Kullandığınız platformlarla çalışır</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: 'Shopify', icon: ShoppingBag, color: 'text-green-400' },
              { name: 'İkas', icon: Globe, color: 'text-purple-400' },
              { name: 'WooCommerce', icon: Globe, color: 'text-blue-400' },
              { name: 'Email (Resend)', icon: Mail, color: 'text-violet-400' },
              { name: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400' },
              { name: 'SMS (Twilio)', icon: MessageSquare, color: 'text-cyan-400' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white/60 hover:border-white/[0.15] hover:text-white transition-all">
                <p.icon className={`w-4 h-4 ${p.color}`} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fiyatlandırma ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-3">Fiyatlandırma</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">Şeffaf ve basit</h2>
            <p className="text-white/40 text-lg">Gizli ücret yok. İstediğiniz zaman iptal edin.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter', price: '$29', period: '/ay',
                desc: 'Küçük mağazalar için başlangıç',
                features: ['2.500 aktif müşteri', '10.000 email/ay', 'AI kampanya oluşturucu', 'Shopify & WooCommerce', 'Temel analitik'],
                cta: 'Ücretsiz Başla', highlight: false,
              },
              {
                name: 'Growth', price: '$79', period: '/ay',
                desc: 'Büyüyen e-ticaret işletmeleri',
                features: ['10.000 aktif müşteri', '50.000 email/ay', 'WhatsApp otomasyonu', 'Gelişmiş segmentasyon', 'Otomasyon akışları', 'Email Builder'],
                cta: 'Hemen Başla', highlight: true,
              },
              {
                name: 'Scale', price: '$199', period: '/ay',
                desc: 'Kurumsal operasyonlar için',
                features: ['Sınırsız müşteri', 'Sınırsız email & SMS', 'WhatsApp Business API', 'Özel AI modeli', 'Dedicated destek', 'SLA garantisi'],
                cta: 'Satış Ekibiyle Görüş', highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 border transition-all ${
                  plan.highlight
                    ? 'border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-900/30'
                    : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block text-[11px] font-semibold bg-violet-500 text-white px-2.5 py-1 rounded-full mb-4">En Popüler</span>
                )}
                <p className="font-bold text-white text-lg mb-1">{plan.name}</p>
                <p className="text-white/30 text-xs mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-white/30 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/50">
                      <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-all ${
                    plan.highlight
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40'
                      : 'border border-white/[0.1] hover:border-white/[0.2] bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-violet-600/10 rounded-3xl blur-3xl pointer-events-none" />
          <div className="relative bg-white/[0.03] border border-white/[0.08] rounded-3xl p-14">
            <p className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">Hemen Başlayın</p>
            <h2 className="text-4xl font-extrabold text-white mb-4">Ekibinizi büyütmeden<br />gelirinizi büyütün.</h2>
            <p className="text-white/40 text-lg mb-8">14 gün ücretsiz deneyin. Kredi kartı gerekmez.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-violet-900/50 hover:-translate-y-0.5"
              >
                Beta Programına Katıl <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="text-white/40 hover:text-white text-sm font-medium transition-colors"
              >
                Zaten hesabım var →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-700 rounded-md flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm text-white">Marksio</span>
          </div>
          <p className="text-xs text-white/20">© 2025 Marksio. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-white/60 transition-colors">Kullanım Şartları</a>
            <a href="#" className="hover:text-white/60 transition-colors">Destek</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
