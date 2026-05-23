export interface EmailContent {
  storeName: string
  accentColor?: string
  badge?: string
  headline: string
  subheadline?: string
  body: string
  discount?: string
  couponCode?: string
  cta: string
  ctaUrl?: string
  heroImage?: string
  products?: Array<{ name: string; price: string; image: string; url?: string }>
  features?: Array<{ emoji: string; title: string; desc: string }>
}

const DEFAULT_FEATURES = [
  { emoji: '🚚', title: 'HIZLI TESLİMAT', desc: 'Siparişleriniz 1-3 iş günü içinde kargoya verilir.' },
  { emoji: '📦', title: 'ÜCRETSİZ KARGO', desc: '500 TL ve üzeri tüm siparişlerde ücretsiz kargo.' },
  { emoji: '🔒', title: 'GÜVENLİ ALIŞVERİŞ', desc: '%100 güvenli ödeme altyapısı ile içiniz rahat olsun.' },
  { emoji: '🎧', title: '7/24 DESTEK', desc: 'Her zaman yanınızda destek ekibimiz hizmetinizde.' },
]

export function buildPremiumEmail(c: EmailContent): string {
  const accent = c.accentColor ?? '#ea5c1e'
  const features = c.features ?? DEFAULT_FEATURES
  const products = c.products ?? []
  const ctaUrl = c.ctaUrl ?? '#'

  return `<!DOCTYPE html>
<html lang="tr" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${c.headline}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  body { margin:0; padding:0; background:#f2f2f2; -webkit-font-smoothing:antialiased; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  a { text-decoration:none; }
  .email-wrapper { background:#f2f2f2; padding:28px 0; }
  .email-container { max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,0.12); }
  @media (max-width:640px) {
    .email-wrapper { padding:0 !important; }
    .email-container { border-radius:0 !important; }
    .hero-text { padding:28px 20px 20px !important; }
    .hero-img { display:none !important; }
    .feature-cell { display:block !important; width:50% !important; float:left; padding:10px !important; }
    .product-cell { width:50% !important; display:inline-block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f2f2f2;font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;">

<div class="email-wrapper">
<div class="email-container">

  <!-- Preheader hidden -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${c.subheadline ?? c.body.slice(0, 90)}</div>

  <!-- View in browser bar -->
  <div style="background:#f9f9f9;border-bottom:1px solid #ebebeb;padding:10px 28px;text-align:center;">
    <span style="font-size:11px;color:#b0b0b0;font-family:'Inter',Helvetica,Arial,sans-serif;">
      Bu e-postayı düzgün görüntüleyemiyorsanız <a href="#" style="color:#b0b0b0;text-decoration:underline;">buraya tıklayın</a>.
    </span>
  </div>

  <!-- Header -->
  <div style="padding:20px 28px;border-bottom:1px solid #f0f0f0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <span style="font-size:22px;font-weight:900;color:#111111;letter-spacing:-0.5px;font-family:'Inter',Helvetica,Arial,sans-serif;">${c.storeName.toUpperCase()}</span>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <span style="font-size:11.5px;color:#777;margin-left:14px;font-family:'Inter',Helvetica,Arial,sans-serif;"><a href="#" style="color:#777;text-decoration:none;">Yeni Gelenler</a></span>
          <span style="font-size:11.5px;color:#777;margin-left:14px;font-family:'Inter',Helvetica,Arial,sans-serif;"><a href="#" style="color:#777;text-decoration:none;">Kadın</a></span>
          <span style="font-size:11.5px;color:#777;margin-left:14px;font-family:'Inter',Helvetica,Arial,sans-serif;"><a href="#" style="color:#777;text-decoration:none;">Erkek</a></span>
          <span style="font-size:11.5px;color:#777;margin-left:14px;font-family:'Inter',Helvetica,Arial,sans-serif;"><a href="#" style="color:#777;text-decoration:none;">İndirim</a></span>
          <span style="font-size:11.5px;color:#777;margin-left:14px;font-family:'Inter',Helvetica,Arial,sans-serif;"><a href="#" style="color:#777;text-decoration:none;">Hesabım</a></span>
        </td>
      </tr>
    </table>
  </div>

  <!-- Hero -->
  <div style="background:#fff8f0;overflow:hidden;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td class="hero-text" style="padding:44px 28px 36px;vertical-align:middle;width:${c.heroImage ? '56%' : '100%'};">
          ${c.badge ? `<div style="display:inline-block;background:${accent};color:#ffffff;font-size:10.5px;font-weight:800;padding:5px 13px;border-radius:5px;margin-bottom:18px;letter-spacing:0.8px;text-transform:uppercase;font-family:'Inter',Helvetica,Arial,sans-serif;">${c.badge}</div><br>` : ''}
          <div style="font-size:${c.discount ? '46' : '36'}px;font-weight:900;color:#111111;line-height:1.05;margin-bottom:14px;font-family:'Inter',Helvetica,Arial,sans-serif;">${c.headline}</div>
          <p style="font-size:14.5px;color:#555555;line-height:1.75;margin:0 0 24px;font-family:'Inter',Helvetica,Arial,sans-serif;">${c.body}</p>
          ${c.couponCode ? `
          <div style="display:inline-block;border:2px dashed ${accent};border-radius:9px;padding:13px 22px;margin-bottom:26px;">
            <span style="font-size:12px;font-weight:700;color:#888888;text-transform:uppercase;letter-spacing:1.2px;font-family:'Inter',Helvetica,Arial,sans-serif;">Kupon Kodu: </span>
            <span style="font-size:18px;font-weight:900;color:${accent};font-family:'Inter',Helvetica,Arial,sans-serif;">${c.couponCode}</span>
          </div><br>` : ''}
          <a href="${ctaUrl}" style="display:inline-block;background:${accent};color:#ffffff;font-size:14.5px;font-weight:700;padding:15px 34px;border-radius:9px;text-decoration:none;letter-spacing:0.2px;font-family:'Inter',Helvetica,Arial,sans-serif;">
            ${c.cta} →
          </a>
          <p style="font-size:11px;color:#c0c0c0;margin:16px 0 0;font-family:'Inter',Helvetica,Arial,sans-serif;">🔒 Güvenli ödeme ile %100 güvenli alışveriş</p>
        </td>
        ${c.heroImage ? `
        <td class="hero-img" style="padding:20px 20px 0 0;vertical-align:bottom;text-align:right;width:44%;">
          <div style="position:relative;display:inline-block;">
            <img src="${c.heroImage}" alt="Kampanya Görseli" width="220" style="width:220px;height:280px;object-fit:cover;border-radius:14px;display:block;" />
            ${c.discount ? `
            <div style="position:absolute;bottom:14px;right:-12px;background:${accent};color:#fff;width:78px;height:78px;border-radius:50%;text-align:center;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,0.25);">
              <div style="font-family:'Inter',Helvetica,Arial,sans-serif;">
                <div style="font-size:9.5px;font-weight:800;line-height:1.2;text-transform:uppercase;">SEPETTE</div>
                <div style="font-size:22px;font-weight:900;line-height:1;">%${c.discount}</div>
                <div style="font-size:9px;font-weight:800;line-height:1.2;text-transform:uppercase;">İNDİRİM</div>
              </div>
            </div>` : ''}
          </div>
        </td>` : ''}
      </tr>
    </table>
  </div>

  <!-- Features row -->
  <div style="padding:32px 20px;border-top:1px solid #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${features.map(f => `
        <td class="feature-cell" style="text-align:center;padding:0 12px;width:25%;vertical-align:top;">
          <div style="font-size:30px;margin-bottom:10px;">${f.emoji}</div>
          <div style="font-size:10.5px;font-weight:800;color:#1a1a1a;letter-spacing:0.5px;margin-bottom:7px;text-transform:uppercase;font-family:'Inter',Helvetica,Arial,sans-serif;">${f.title}</div>
          <div style="font-size:11px;color:#888888;line-height:1.6;font-family:'Inter',Helvetica,Arial,sans-serif;">${f.desc}</div>
        </td>`).join('')}
      </tr>
    </table>
  </div>

  ${products.length > 0 ? `
  <!-- Products -->
  <div style="padding:10px 20px 36px;border-top:1px solid #f5f5f5;">
    <div style="text-align:center;font-size:16px;font-weight:800;color:#111111;letter-spacing:0.4px;margin-bottom:22px;text-transform:uppercase;font-family:'Inter',Helvetica,Arial,sans-serif;">SİZİN İÇİN SEÇTİKLERİMİZ</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        ${products.slice(0, 4).map(p => `
        <td class="product-cell" style="width:${products.length >= 4 ? '25' : Math.floor(100 / Math.min(products.length, 4))}%;padding:0 8px;text-align:center;vertical-align:top;">
          <a href="${p.url ?? '#'}" style="text-decoration:none;display:block;">
            <div style="border-radius:10px;overflow:hidden;margin-bottom:10px;background:#f8f8f8;">
              <img src="${p.image}" alt="${p.name}" style="width:100%;height:138px;object-fit:cover;display:block;" />
            </div>
            <div style="font-size:12px;font-weight:600;color:#222222;margin-bottom:5px;font-family:'Inter',Helvetica,Arial,sans-serif;">${p.name}</div>
            <div style="font-size:13.5px;font-weight:800;color:#111111;margin-bottom:12px;font-family:'Inter',Helvetica,Arial,sans-serif;">${p.price} TL</div>
            <div style="border:1.5px solid #e0e0e0;border-radius:7px;padding:8px 4px;font-size:11px;color:#555555;font-weight:600;font-family:'Inter',Helvetica,Arial,sans-serif;">ÜRÜNÜ İNCELE</div>
          </a>
        </td>`).join('')}
      </tr>
    </table>
  </div>` : ''}

  <!-- Thank you section -->
  <div style="padding:24px 28px;border-top:1px solid #f0f0f0;background:#fafafa;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="vertical-align:middle;">
          <div style="font-size:22px;margin-bottom:8px;color:${accent};">♡</div>
          <div style="font-size:13px;color:#555555;line-height:1.7;font-family:'Inter',Helvetica,Arial,sans-serif;">
            Bizi tercih ettiğiniz için teşekkür ederiz.<br>
            <strong style="color:#333333;">${c.storeName} ailesi olarak her zaman yanınızdayız.</strong>
          </div>
        </td>
        <td style="text-align:right;vertical-align:middle;">
          <div style="font-size:20px;color:#333333;font-style:italic;font-family:Georgia,serif;">Teşekkürler!</div>
          <div style="font-size:13px;color:#888888;font-weight:600;margin-top:5px;font-family:'Inter',Helvetica,Arial,sans-serif;">${c.storeName} Ekibi</div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Footer -->
  <div style="background:#f4f4f4;padding:26px 28px;text-align:center;border-top:1px solid #e8e8e8;">
    <div style="margin-bottom:16px;">
      <a href="#" style="display:inline-block;margin:0 5px;"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/24px-Instagram_logo_2016.svg.png" width="22" height="22" alt="Instagram" style="border-radius:5px;" /></a>
      <a href="#" style="display:inline-block;margin:0 5px;"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/24px-2021_Facebook_icon.svg.png" width="22" height="22" alt="Facebook" style="border-radius:5px;" /></a>
      <a href="#" style="display:inline-block;margin:0 5px;"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/24px-YouTube_full-color_icon_%282017%29.svg.png" width="22" height="22" alt="YouTube" style="border-radius:5px;" /></a>
    </div>
    <div style="font-size:11px;color:#aaaaaa;line-height:2;font-family:'Inter',Helvetica,Arial,sans-serif;">
      Bu e-posta <strong>${c.storeName}</strong> tarafından gönderilmiştir.<br>
      Artık e-posta almak istemiyorsanız <a href="#" style="color:#aaaaaa;text-decoration:underline;">buradan</a> çıkış yapabilirsiniz.<br>
      © 2024 ${c.storeName}. Tüm hakları saklıdır.
    </div>
  </div>

</div>
</div>

</body>
</html>`
}

export type { EmailContent as PremiumEmailContent }
