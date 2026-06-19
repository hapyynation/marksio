import Link from 'next/link'

export const metadata = {
  title: 'Gizlilik Politikası — Marksio',
  description: 'Marksio platformunun kişisel verilerin korunmasına ilişkin gizlilik politikası.',
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090f', color: '#e2e1eb', fontFamily: 'Geist, Inter, sans-serif' }}>

      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>M</div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#e2e1eb', letterSpacing: '-0.02em' }}>Marksio</span>
        </Link>
        <Link href="/login" style={{ fontSize: 13, color: '#8080a0', textDecoration: 'none' }}>
          Platforma Dön
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#e2e1eb', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Gizlilik Politikası
        </h1>
        <p style={{ fontSize: 13, color: '#8080a0', marginBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24 }}>
          Son güncelleme: 19 Haziran 2026
        </p>

        <Section title="1. Veri Sorumlusu">
          <p>Bu Gizlilik Politikası, Marksio ("Platform", "biz") tarafından işletilen <strong>app.marksio.com</strong> hizmetini kullanan mağaza sahipleri ("Kullanıcı") ve Kullanıcıların müşterileri ("Son Kullanıcı") için geçerlidir.</p>
          <p style={{ marginTop: 12 }}>
            <strong>Veri Sorumlusu:</strong> Vosensio<br />
            <strong>İletişim:</strong> <a href="mailto:info@vosensio.com" style={{ color: '#4470ff' }}>info@vosensio.com</a>
          </p>
        </Section>

        <Section title="2. Topladığımız Veriler">
          <SubTitle>2.1 Kullanıcı (mağaza sahibi) verileri</SubTitle>
          <ul>
            <li>Hesap bilgileri: ad, e-posta, şifre (şifrelenmiş)</li>
            <li>Mağaza bilgileri: Shopify / İkas / WooCommerce mağaza bağlantı bilgileri</li>
            <li>Fatura bilgileri: Lemon Squeezy üzerinden işlenen ödeme bilgileri (kart bilgileri bizde saklanmaz, Lemon Squeezy'de işlenir)</li>
            <li>WhatsApp Business API kimlik bilgileri: Meta erişim token'ları ve uygulama sırları, AES-256 ile şifrelenerek saklanır</li>
          </ul>
          <SubTitle>2.2 Son Kullanıcı (mağaza müşterisi) verileri</SubTitle>
          <ul>
            <li>E-posta adresi ve e-posta etkileşim verisi (gönderim, açılma, tıklama)</li>
            <li>WhatsApp telefon numarası ve mesajlaşma geçmişi</li>
            <li>Mağaza platformundan (Shopify / İkas / WooCommerce) gelen sipariş ve müşteri verisi, pazarlama otomasyonu amacıyla</li>
          </ul>
        </Section>

        <Section title="3. Verileri Nasıl Kullanıyoruz">
          <ul>
            <li>E-posta ve WhatsApp pazarlama kampanyalarını göndermek</li>
            <li>Sepet hatırlatma, sipariş bildirimi gibi otomasyonları çalıştırmak</li>
            <li>WhatsApp AI Asistan özelliği aktifse, müşteri sorularına otomatik yanıt üretmek (yalnızca Kullanıcının bu özelliği etkinleştirdiği hesaplarda, müşteri verisine salt okunur erişimle)</li>
            <li>Platform performansını analiz etmek ve iyileştirmek</li>
            <li>Yasal yükümlülükleri yerine getirmek</li>
          </ul>
        </Section>

        <Section title="4. Verileri Paylaştığımız Üçüncü Taraflar">
          <p>Verilerinizi aşağıdaki hizmet sağlayıcılarla, hizmetin çalışması için gerekli ölçüde paylaşırız:</p>
          <ul>
            <li><strong>Meta Platforms, Inc.</strong> — WhatsApp Business API üzerinden mesajlaşma</li>
            <li><strong>Resend</strong> — e-posta gönderimi</li>
            <li><strong>Lemon Squeezy</strong> — ödeme işleme</li>
            <li><strong>Supabase</strong> — veritabanı barındırma</li>
            <li><strong>Groq / Fal.ai</strong> — AI destekli içerik üretimi ve otomatik yanıtlama (yalnızca ilgili özellikler etkinleştirildiğinde)</li>
            <li><strong>Vercel</strong> — uygulama barındırma</li>
          </ul>
        </Section>

        <Section title="5. Veri Saklama Süresi">
          <p>Verileriniz, hesabınız aktif olduğu sürece ve yasal saklama yükümlülüklerimiz çerçevesinde saklanır. Hesap kapatıldığında, verileriniz 30 gün içinde silinir (yasal saklama zorunlulukları hariç).</p>
        </Section>

        <Section title="6. KVKK Kapsamında Haklarınız">
          <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde / yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
            <li>Zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Bu haklarınızı kullanmak için{' '}
            <a href="mailto:info@vosensio.com" style={{ color: '#4470ff' }}>info@vosensio.com</a>{' '}
            adresinden bizimle iletişime geçebilirsiniz.
          </p>
        </Section>

        <Section title="7. Veri Güvenliği">
          <p>Hassas veriler (API token'ları, erişim anahtarları) AES-256 şifreleme ile saklanır. Tüm veri iletimi HTTPS / TLS üzerinden şifrelenir.</p>
        </Section>

        <Section title="8. Çocukların Gizliliği">
          <p>Platformumuz 18 yaş altı bireylere yönelik değildir ve bilerek çocuklardan veri toplamayız.</p>
        </Section>

        <Section title="9. Politika Değişiklikleri">
          <p>Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişikliklerde Kullanıcıları e-posta veya platform üzerinden bilgilendiririz.</p>
        </Section>

        <Section title="10. İletişim">
          <p>
            Sorularınız için:{' '}
            <a href="mailto:info@vosensio.com" style={{ color: '#4470ff' }}>info@vosensio.com</a>
          </p>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#3e3e54' }}>
          © 2026 Vosensio. Tüm hakları saklıdır.{' '}
          <Link href="/" style={{ color: '#3e3e54', textDecoration: 'underline' }}>Marksio</Link>
        </p>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e1eb', letterSpacing: '-0.01em', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, color: '#a0a0bc', lineHeight: 1.8 }}>
        {children}
      </div>
    </section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, fontWeight: 600, color: '#c0c0d8', marginTop: 16, marginBottom: 8 }}>
      {children}
    </p>
  )
}
