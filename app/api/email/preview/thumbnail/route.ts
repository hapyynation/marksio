import { NextRequest, NextResponse } from 'next/server'
import { buildPremiumEmail } from '@/lib/premium-email-builder'

const ACCENT: Record<string, string> = {
  promotion: '#ea5c1e', abandoned_cart: '#d97706', new_product: '#7c3aed',
  winback: '#d97706', vip: '#1a1a1a', welcome: '#059669',
}

const BADGE: Record<string, string> = {
  promotion: 'SIZE ÖZEL FIRSAT!', abandoned_cart: 'SEPETİNİZ SİZİ BEKLİYOR',
  new_product: 'YENİ KOLEKSİYON', winback: 'SİZİ ÖZLEDİK!',
  vip: 'VIP ÜYELERİMİZE ÖZEL', welcome: 'HOŞ GELDİNİZ!',
}

const PLACEHOLDERS: Record<string, { headline: string; body: string; cta: string; discount?: string; couponCode?: string }> = {
  promotion: { headline: 'SEPETTE %15 İNDİRİM', body: 'Seçili ürünlerde geçerli sepette %15 indirim fırsatını kaçırmayın. Hemen tamamlayın!', cta: 'ALIŞVERİŞE BAŞLA', discount: '15', couponCode: 'MARKSIO15' },
  abandoned_cart: { headline: 'Sepetinizde Ürünler Var!', body: 'Sepetinizde bıraktığınız ürünler sizi bekliyor. Hemen tamamlayın!', cta: 'Sepeti Tamamla', discount: '10', couponCode: 'GERI10' },
  new_product: { headline: 'Yeni Koleksiyon Geldi!', body: 'Yeni sezon koleksiyonumuz kapılarınıza geliyor. En şık parçalar, en uygun fiyatlarla!', cta: 'Koleksiyonu Keşfet' },
  winback: { headline: 'Sizi Özledik!', body: 'Uzun süredir görüşemiyoruz. Sizi geri kazanmak için özel bir teklif hazırladık.', cta: 'Alışverişe Dön', discount: '20', couponCode: 'HOSGELDIN20' },
  vip: { headline: 'VIP Üyemize Özel Teklif', body: 'Değerli VIP müşterimiz, size özel hazırladığımız bu fırsatı kaçırmayın.', cta: 'VIP Koleksiyona Git', discount: '25', couponCode: 'VIP25' },
  welcome: { headline: 'Aramıza Hoş Geldiniz!', body: 'Marksio ailesine katıldığınız için teşekkür ederiz! Özel kampanyalar sizi bekliyor.', cta: 'Alışverişe Başla', couponCode: 'HOSGELDIN10' },
}

export async function GET(req: NextRequest) {
  const templateId = req.nextUrl.searchParams.get('template') || 'promotion'
  const ph = PLACEHOLDERS[templateId] || PLACEHOLDERS.promotion

  const html = buildPremiumEmail({
    storeName: 'Demo Mağaza',
    accentColor: ACCENT[templateId] ?? '#ea5c1e',
    badge: BADGE[templateId],
    headline: ph.headline,
    body: ph.body,
    cta: ph.cta,
    ctaUrl: '#',
    discount: ph.discount,
    couponCode: ph.couponCode,
  })

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
