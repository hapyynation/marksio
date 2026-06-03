'use client'

import { useState, useRef, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  Upload, X, Check, Code2, Send, Mail, Monitor, Smartphone,
  Loader2, Copy, Sparkles, Tag, ShoppingCart, Star, Zap,
  Package, Instagram, RefreshCw, ChevronRight, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BANNER_HERO_STYLES, type BannerStyleId } from '@/lib/banner-hero'

// ─── Types ───────────────────────────────────────────────────────────────────

type EmailTemplateId = 'indirim' | 'yeniurun' | 'sepetterk' | 'premium' | 'blackfriday' | 'minimal'
type PreviewMode     = 'desktop' | 'mobile' | 'square'

interface EmailFields {
  title: string
  description: string
  discount: string
  price: string
  originalPrice: string
  coupon: string
  cta: string
  ctaUrl: string
  footer: string
  unsubscribeUrl: string
  brandName: string
  brandColor: string
}

interface GeneratedBanners {
  desktop: string | null
  mobile:  string | null
  square:  string | null
}

interface EmailTemplateConfig {
  id: EmailTemplateId
  name: string
  description: string
  icon: React.ElementType
  previewImage: string
  defaults: Partial<EmailFields>
  accentColor: string
  dark?: boolean
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: EmailTemplateConfig[] = [
  {
    id: 'indirim', name: 'İndirim Maili', description: 'İndirim duyurusu, fiyat karşılaştırması',
    icon: Tag, previewImage: '/templates/email-indirim.jpeg', accentColor: '#e84545',
    defaults: { title: 'BÜYÜK YAZI İNDİRİMİ!', description: 'Seçili ürünlerde sınırlı süre geçerli.', discount: '%50', price: '₺299', originalPrice: '₺599', coupon: 'INDIRIM50', cta: 'Hemen Alışveriş Yap' },
  },
  {
    id: 'yeniurun', name: 'Yeni Ürün Tanıtımı', description: 'Yeni koleksiyon lansmanı',
    icon: Sparkles, previewImage: '/templates/email-yeniurun.jpeg', accentColor: '#4470ff',
    defaults: { title: 'YENİ KOLEKSİYON GELDİ', description: 'Sezonun en yeni parçaları mağazamızda.', discount: '', price: '₺449', originalPrice: '', coupon: '', cta: 'Koleksiyonu Keşfet' },
  },
  {
    id: 'sepetterk', name: 'Sepet Terk Maili', description: 'Sepeti terk eden müşteriler',
    icon: ShoppingCart, previewImage: '/templates/email-sepetterk.jpeg', accentColor: '#f0a020',
    defaults: { title: 'Sepetinizde ürün var!', description: 'Seçtiğiniz ürünler sizi bekliyor.', discount: '%10', price: '₺349', originalPrice: '₺389', coupon: 'GERI10', cta: 'Alışverişi Tamamla' },
  },
  {
    id: 'premium', name: 'Premium Lansman', description: 'Lüks ürünler için koyu tasarım',
    icon: Star, previewImage: '/templates/email-premium.jpeg', accentColor: '#c9a227', dark: true,
    defaults: { title: 'EXCLUSIVE COLLECTION', description: 'Sınırlı sayıda, özel tasarım koleksiyon.', discount: '', price: '₺2.490', originalPrice: '', coupon: 'VIP2025', cta: 'Exclusive Koleksiyona Ulaş' },
  },
  {
    id: 'blackfriday', name: 'Black Friday', description: 'Efsane cuma kampanyası',
    icon: Zap, previewImage: '/templates/email-blackfriday.jpeg', accentColor: '#ffffff', dark: true,
    defaults: { title: 'BLACK FRIDAY', description: 'Yılın en büyük indirimi başladı. Sınırlı stok!', discount: '%70', price: '₺199', originalPrice: '₺669', coupon: 'BF2025', cta: 'Fırsatı Yakala' },
  },
  {
    id: 'minimal', name: 'Minimal E-Ticaret', description: 'Sade, ürünü ön plana çıkaran',
    icon: Package, previewImage: '/templates/email-minimal.jpeg', accentColor: '#111827',
    defaults: { title: 'Sizin için seçtik', description: 'Özenle tasarlanmış, kaliteyi hissettiren ürünler.', discount: '', price: '₺850', originalPrice: '', coupon: '', cta: 'İncele' },
  },
]

const DEFAULT_FIELDS: EmailFields = {
  title: 'Başlık', description: 'Açıklama metni.', discount: '%50',
  price: '₺299', originalPrice: '₺599', coupon: 'KUPON20',
  cta: 'Alışverişe Başla', ctaUrl: '#',
  footer: '© 2025 Marksio. Tüm hakları saklıdır.',
  unsubscribeUrl: '#', brandName: 'Marksio', brandColor: '#4470ff',
}

// ─── HTML Email Generators ────────────────────────────────────────────────────

function ctaRow(cta: string, ctaUrl: string, accent: string, textColor = '#ffffff') {
  return `<tr>
  <td style="padding:0 40px 32px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td bgcolor="${accent}" style="border-radius:12px;background-color:${accent};">
          <a href="${ctaUrl || '#'}" style="display:block;padding:16px 40px;font-size:14px;font-weight:700;color:${textColor};text-decoration:none;letter-spacing:0.04em;font-family:'Inter','Helvetica Neue',Arial,sans-serif;white-space:nowrap;">${cta} →</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

function footerRow(brandName: string, footer: string, unsub: string, accent: string, bg = '#f8f9fa') {
  return `<tr>
  <td bgcolor="${bg}" style="padding:14px 40px 18px;text-align:center;background-color:${bg};">
    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;">${footer || `© 2025 ${brandName}`}</p>
    <p style="margin:0;font-size:11px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;">
      <a href="${unsub || '#'}" style="color:${accent};text-decoration:none;">Aboneliği iptal et</a>
    </p>
  </td>
</tr>`
}

function heroRow(heroImage: string | null, fallback: string, alt: string) {
  const src = heroImage || fallback
  return `<tr>
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${src}" width="600" alt="${alt}"
      style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;border:0;outline:none;-ms-interpolation-mode:bicubic;">
  </td>
</tr>`
}

function emailWrapper(content: string, pageBg = '#f0f2f5') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Email</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
@media(max-width:480px){
  .em-container{border-radius:10px!important}
  .em-pad{padding-left:20px!important;padding-right:20px!important}
  .em-hero img{height:200px!important}
  .em-title{font-size:20px!important;line-height:1.2!important}
  .em-price{font-size:26px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${pageBg};font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${pageBg};padding:20px 0;">
<tr><td align="center" style="padding:0 12px;">
<table class="em-container" role="presentation" width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;border-radius:14px;overflow:hidden;background-color:#ffffff;">
${content}
</table>
</td></tr>
</table>
</body>
</html>`
}

function generateEmail(tplId: EmailTemplateId, f: EmailFields, heroImage: string | null): string {
  const a = f.brandColor || '#4470ff'

  if (tplId === 'indirim') {
    return emailWrapper(`
<tr><td bgcolor="${a}" height="4" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td></tr>
<tr class="em-hero">
  <td style="padding:0;line-height:0;font-size:0;position:relative;">
    <img src="${heroImage || '/templates/email-indirim.jpeg'}" width="600" alt="${f.title}"
      style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;border:0;">
    ${f.discount ? `<div style="position:absolute;top:20px;right:20px;background:${a};color:#fff;font-size:20px;font-weight:900;padding:10px 16px;border-radius:10px;font-family:'Inter',Arial,sans-serif;line-height:1;text-align:center;">${f.discount}<br><span style="font-size:9px;font-weight:600;letter-spacing:1px;display:block;margin-top:2px;">İNDİRİM</span></div>` : ''}
  </td>
</tr>
<tr><td class="em-pad" style="padding:28px 40px 0;">
  <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">${f.brandName}</p>
  <h1 class="em-title" style="margin:0 0 10px;font-size:26px;font-weight:900;color:#111827;letter-spacing:-0.025em;line-height:1.15;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
  <p style="margin:0 0 14px;font-size:14px;color:#6b7280;line-height:1.55;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr>
    ${f.originalPrice ? `<td style="font-size:16px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:10px;">${f.originalPrice}</td>` : ''}
    <td class="em-price" style="font-size:34px;font-weight:900;color:${a};letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;">${f.price}</td>
  </tr></table>
  ${f.coupon ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="padding:12px 18px;border:2px dashed ${a};border-radius:10px;text-align:center;background:${a}0d;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">Kupon Kodu</p><p style="margin:0;font-size:20px;font-weight:900;letter-spacing:5px;color:${a};font-family:'Courier New',monospace;">${f.coupon}</p></td></tr></table>` : ''}
</td></tr>
${ctaRow(f.cta, f.ctaUrl, a)}
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`)
  }

  if (tplId === 'yeniurun') {
    return emailWrapper(`
<tr><td bgcolor="${a}" style="padding:18px 40px;background-color:${a};">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:20px;padding:4px 14px;background:rgba(255,255,255,0.2);">
      <span style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#fff;font-family:'Inter',Arial,sans-serif;">✨ YENİ ÜRÜN</span>
    </td>
  </tr></table>
  <p style="margin:6px 0 0;font-size:18px;font-weight:700;color:#fff;font-family:'Inter',Arial,sans-serif;">${f.brandName}</p>
</td></tr>
<tr class="em-hero">
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${heroImage || '/templates/email-yeniurun.jpeg'}" width="600" alt="${f.title}"
      style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;border:0;">
  </td>
</tr>
<tr><td class="em-pad" style="padding:26px 40px 0;">
  <h1 class="em-title" style="margin:0 0 10px;font-size:24px;font-weight:900;color:#111827;letter-spacing:-0.025em;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
  <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.55;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
  <p style="margin:0 0 20px;font-size:30px;font-weight:900;color:${a};letter-spacing:-0.03em;font-family:'Inter',Arial,sans-serif;">${f.price}</p>
</td></tr>
${ctaRow(f.cta, f.ctaUrl, a)}
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`)
  }

  if (tplId === 'sepetterk') {
    return emailWrapper(`
<tr><td bgcolor="${a}" height="4" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td></tr>
<tr><td class="em-pad" style="padding:22px 40px 14px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${a};font-family:'Inter',Arial,sans-serif;">🛒 Sepetiniz Sizi Bekliyor</p>
  <h1 class="em-title" style="margin:0;font-size:22px;font-weight:900;color:#111827;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
</td></tr>
<tr><td class="em-pad" style="padding:0 40px 18px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:12px;overflow:hidden;">
    <tr>
      <td width="130" style="padding:14px;vertical-align:middle;">
        <img src="${heroImage || '/templates/email-sepetterk.jpeg'}" width="102" alt="${f.title}"
          style="display:block;width:102px;height:102px;object-fit:cover;border:0;border-radius:8px;">
      </td>
      <td style="padding:14px 14px 14px 0;vertical-align:middle;">
        <p style="margin:0 0 5px;font-size:14px;font-weight:700;color:#111827;font-family:'Inter',Arial,sans-serif;">${f.title}</p>
        <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.5;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          ${f.originalPrice ? `<td style="font-size:13px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:8px;">${f.originalPrice}</td>` : ''}
          <td style="font-size:20px;font-weight:900;color:${a};font-family:'Inter',Arial,sans-serif;">${f.price}</td>
        </tr></table>
      </td>
    </tr>
  </table>
</td></tr>
<tr><td class="em-pad" style="padding:0 40px 16px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">⏰ Stok tükenmeden tamamlayın!</p>
</td></tr>
${f.coupon ? `<tr><td class="em-pad" style="padding:0 40px 18px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:11px 18px;border:2px dashed ${a};border-radius:9px;text-align:center;background:${a}0d;"><p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">Ekstra ${f.discount} İndirim</p><p style="margin:0;font-size:18px;font-weight:900;letter-spacing:4px;color:${a};font-family:'Courier New',monospace;">${f.coupon}</p></td></tr></table></td></tr>` : ''}
${ctaRow(f.cta, f.ctaUrl, a)}
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`)
  }

  if (tplId === 'premium') {
    return emailWrapper(`
<tr>
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${heroImage || '/templates/email-premium.jpeg'}" width="600" alt="${f.title}"
      style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;border:0;">
  </td>
</tr>
<tr><td class="em-pad" style="padding:30px 40px 26px;background-color:#0d0d14;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
    <td style="border-radius:20px;padding:4px 14px;background:${a}22;border:1px solid ${a}44;">
      <span style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">EXCLUSIVE LAUNCH</span>
    </td>
  </tr></table>
  <h1 class="em-title" style="margin:0 0 10px;font-size:28px;font-weight:900;color:#f5f0e8;letter-spacing:-0.02em;line-height:1.15;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
  <p style="margin:0 0 16px;font-size:14px;color:#8b8b9e;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
  ${f.coupon ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="padding:9px 16px;border:1px solid ${a}55;border-radius:8px;background:${a}11;"><span style="font-size:10px;color:#8b8b9e;font-family:'Inter',Arial,sans-serif;">VIP Kodu: </span><span style="font-size:13px;font-weight:700;letter-spacing:3px;color:${a};font-family:'Courier New',monospace;">${f.coupon}</span></td></tr></table>` : ''}
  <p style="margin:0 0 22px;font-size:32px;font-weight:900;color:${a};letter-spacing:-0.03em;font-family:'Inter',Arial,sans-serif;">${f.price}</p>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="border-radius:10px;background-color:${a};">
      <a href="${f.ctaUrl || '#'}" style="display:block;padding:15px 34px;font-size:13px;font-weight:700;color:#0d0d14;text-decoration:none;letter-spacing:0.06em;font-family:'Inter',Arial,sans-serif;white-space:nowrap;">${f.cta} →</a>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:13px 40px 16px;text-align:center;background-color:#08080f;">
  <p style="margin:0 0 3px;font-size:11px;color:#3e3e54;font-family:'Inter',Arial,sans-serif;">${f.footer || `© 2025 ${f.brandName}`}</p>
  <p style="margin:0;font-size:11px;color:#3e3e54;font-family:'Inter',Arial,sans-serif;"><a href="${f.unsubscribeUrl || '#'}" style="color:${a};text-decoration:none;">Aboneliği iptal et</a></p>
</td></tr>`, '#0a0a10')
  }

  if (tplId === 'blackfriday') {
    return emailWrapper(`
<tr><td class="em-pad" style="padding:30px 40px 0;background-color:#000;text-align:center;">
  <p style="margin:0 0 2px;font-size:9px;font-weight:700;letter-spacing:4px;color:#555;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">— ${f.brandName} —</p>
  <h1 style="margin:6px 0;font-size:46px;font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">${f.title}</h1>
  ${f.discount ? `<p style="margin:0 0 2px;font-size:72px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1;font-family:'Inter',Arial,sans-serif;">${f.discount}</p><p style="margin:0;font-size:11px;font-weight:700;letter-spacing:3px;color:#555;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">İNDİRİM</p>` : ''}
</td></tr>
<tr class="em-hero"><td style="padding:20px 0 0;background-color:#000;line-height:0;font-size:0;">
  <img src="${heroImage || '/templates/email-blackfriday.jpeg'}" width="600" alt="${f.title}"
    style="display:block;width:100%;max-width:600px;height:280px;object-fit:cover;border:0;opacity:0.85;">
</td></tr>
<tr><td class="em-pad" style="padding:22px 40px 18px;background-color:#000;">
  <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.55;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;"><tr>
    ${f.originalPrice ? `<td style="font-size:15px;color:#555;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:10px;">${f.originalPrice}</td>` : ''}
    <td style="font-size:34px;font-weight:900;color:#fff;letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;">${f.price}</td>
  </tr></table>
  ${f.coupon ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr><td style="padding:9px 16px;border:2px dashed rgba(255,255,255,0.25);border-radius:8px;background:rgba(255,255,255,0.05);"><span style="font-size:9px;color:#666;font-family:'Inter',Arial,sans-serif;letter-spacing:1px;">KOD: </span><span style="font-size:17px;font-weight:900;letter-spacing:4px;color:#fff;font-family:'Courier New',monospace;">${f.coupon}</span></td></tr></table>` : ''}
</td></tr>
<tr><td style="padding:0 40px 28px;text-align:center;background-color:#000;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
    <td style="border-radius:10px;background-color:#fff;">
      <a href="${f.ctaUrl || '#'}" style="display:block;padding:15px 38px;font-size:13px;font-weight:700;color:#000;text-decoration:none;letter-spacing:0.04em;font-family:'Inter',Arial,sans-serif;white-space:nowrap;">${f.cta} →</a>
    </td>
  </tr></table>
</td></tr>
<tr><td style="padding:12px 40px 15px;text-align:center;background-color:#0a0a0a;border-top:1px solid #1a1a1a;">
  <p style="margin:0 0 3px;font-size:11px;color:#444;font-family:'Inter',Arial,sans-serif;">${f.footer || `© 2025 ${f.brandName}`}</p>
  <p style="margin:0;font-size:11px;color:#444;font-family:'Inter',Arial,sans-serif;"><a href="${f.unsubscribeUrl || '#'}" style="color:#888;text-decoration:none;">Aboneliği iptal et</a></p>
</td></tr>`, '#0a0a0a')
  }

  // minimal (default)
  return emailWrapper(`
<tr><td class="em-pad" style="padding:26px 40px 18px;border-bottom:1px solid #f3f4f6;">
  <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">${f.brandName}</p>
</td></tr>
<tr class="em-hero"><td style="padding:0;line-height:0;font-size:0;">
  <img src="${heroImage || '/templates/email-minimal.jpeg'}" width="600" alt="${f.title}"
    style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;border:0;">
</td></tr>
<tr><td class="em-pad" style="padding:26px 40px 0;border-top:1px solid #f3f4f6;">
  <h1 class="em-title" style="margin:0 0 10px;font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.015em;line-height:1.2;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
  <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
    ${f.originalPrice ? `<td style="font-size:14px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:10px;">${f.originalPrice}</td>` : ''}
    <td style="font-size:26px;font-weight:700;color:#111827;letter-spacing:-0.025em;font-family:'Inter',Arial,sans-serif;">${f.price}</td>
  </tr></table>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:22px;"><tr>
    <td style="border-radius:9px;border:2px solid ${a};">
      <a href="${f.ctaUrl || '#'}" style="display:block;padding:13px 34px;font-size:12px;font-weight:600;color:${a};text-decoration:none;letter-spacing:0.04em;font-family:'Inter',Arial,sans-serif;white-space:nowrap;">${f.cta}</a>
    </td>
  </tr></table>
</td></tr>
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>{children}</label>
}

function FieldInput({ value, onChange, placeholder, type = 'text', multiline }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean
}) {
  const style: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: '#f9fafb',
    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12,
    color: '#111827', outline: 'none', resize: multiline ? 'vertical' : 'none', fontFamily: 'inherit',
  }
  if (multiline) {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} style={style}
      onFocus={e => (e.currentTarget.style.borderColor = '#4470ff')} onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
  }
  return <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style}
    onFocus={e => (e.currentTarget.style.borderColor = '#4470ff')} onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
}

const BRAND_COLORS = ['#4470ff', '#e84545', '#22c97a', '#f0a020', '#9f7afa', '#c9a227', '#0ea5e9', '#111827']

function TestMailModal({ html, onClose, brandName }: { html: string; onClose: () => void; brandName?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  async function send() {
    if (!email.trim()) { setErr('E-posta adresi gerekli.'); return }
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/ai/banner-test-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), bannerHtml: html, storeName: brandName }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSent(true)
    } catch (e) { setErr((e as Error).message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="w-[360px] rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <p className="text-[14px] font-bold" style={{ color: '#111827' }}>Test Mail Gönder</p>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
        </div>
        <div className="p-5">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: '#f0fdf4' }}>
                <Check className="w-6 h-6" style={{ color: '#16a34a' }} />
              </div>
              <p className="text-[14px] font-bold mb-3" style={{ color: '#111827' }}>Gönderildi!</p>
              <button onClick={onClose} className="px-5 py-2 rounded-xl text-[12px] font-semibold" style={{ background: '#f5f3ff', color: '#4470ff' }}>Kapat</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div><FieldLabel>E-posta Adresi</FieldLabel><FieldInput value={email} onChange={setEmail} placeholder="ornek@mail.com" type="email" /></div>
              {err && <p className="text-[11px]" style={{ color: '#dc2626' }}>{err}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>İptal</button>
                <button onClick={send} disabled={loading} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#4470ff,#6c47ff)', color: '#fff' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIStudioPage() {
  // Product
  const [productImage, setProductImage]   = useState<string | null>(null)
  const [productName,  setProductName]    = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Banner generation
  const [bannerStyle,       setBannerStyle]       = useState<BannerStyleId>('premium-studio')
  const [generatingBanner,  setGeneratingBanner]  = useState(false)
  const [generatedBanners,  setGeneratedBanners]  = useState<GeneratedBanners | null>(null)
  const [bannerError,       setBannerError]       = useState('')

  // Email editing
  const [selectedTemplate, setSelectedTemplate]   = useState<EmailTemplateId>('indirim')
  const [fields,           setFields]             = useState<EmailFields>({ ...DEFAULT_FIELDS })
  const [previewMode,      setPreviewMode]        = useState<PreviewMode>('desktop')

  // UI
  const [copied,       setCopied]       = useState(false)
  const [testMailOpen, setTestMailOpen] = useState(false)

  const tplConfig    = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate)!
  const heroImage    = generatedBanners
    ? (previewMode === 'mobile' ? generatedBanners.mobile : previewMode === 'square' ? generatedBanners.square : generatedBanners.desktop)
    : productImage
  const emailHtml    = generateEmail(selectedTemplate, { ...fields, brandColor: fields.brandColor || tplConfig.accentColor }, heroImage)
  const bannerStyleDef = BANNER_HERO_STYLES.find(s => s.id === bannerStyle)!

  const setF = useCallback(<K extends keyof EmailFields>(k: K) => (v: EmailFields[K]) => {
    setFields(p => ({ ...p, [k]: v }))
  }, [])

  function selectTemplate(id: EmailTemplateId) {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id)!
    setSelectedTemplate(id)
    setFields(p => ({ ...p, ...tpl.defaults, brandColor: tpl.accentColor }))
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => {
      setProductImage(e.target?.result as string)
      setGeneratedBanners(null)
    }
    reader.readAsDataURL(file)
  }

  async function generateBanner() {
    if (!productImage) return
    setGeneratingBanner(true)
    setBannerError('')
    setGeneratedBanners(null)
    try {
      const r = await fetch('/api/ai/banner-hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageUrl: productImage,
          backgroundStyle: bannerStyle,
          productName,
          brandName: fields.brandName,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setGeneratedBanners({ desktop: d.desktop ?? null, mobile: d.mobile ?? null, square: d.square ?? null })
      setPreviewMode('desktop')
    } catch (e) {
      setBannerError((e as Error).message)
    } finally {
      setGeneratingBanner(false)
    }
  }

  function copyHTML() {
    navigator.clipboard.writeText(emailHtml).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <AppShell>
      {testMailOpen && <TestMailModal html={emailHtml} onClose={() => setTestMailOpen(false)} brandName={fields.brandName} />}

      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#f2f2f7' }}>

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-6 shrink-0"
          style={{ height: 56, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4470ff,#9f7afa)' }}>
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-tight" style={{ color: '#111827' }}>Email Şablon Builder</p>
              <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                {generatedBanners ? `${bannerStyleDef.icon} ${bannerStyleDef.name} banner oluşturuldu` : `${tplConfig.name} seçili`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Preview size toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl" style={{ background: '#f3f4f6' }}>
              {([
                ['desktop', Monitor,     'Desktop 1200×600'],
                ['mobile',  Smartphone,  'Mobil 1080×1350'],
                ['square',  Instagram,   'Instagram 1:1'],
              ] as [PreviewMode, React.ElementType, string][]).map(([mode, Icon, label]) => (
                <button key={mode} onClick={() => setPreviewMode(mode)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                  title={label}
                  style={{
                    background: previewMode === mode ? '#fff' : 'transparent',
                    color: previewMode === mode ? '#4470ff' : '#9ca3af',
                    boxShadow: previewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{mode === 'desktop' ? 'Desktop' : mode === 'mobile' ? 'Mobil' : 'Instagram'}</span>
                </button>
              ))}
            </div>

            <button onClick={copyHTML}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold transition-all"
              style={{ background: copied ? '#f0fdf4' : '#f9fafb', color: copied ? '#16a34a' : '#374151', border: `1px solid ${copied ? '#bbf7d0' : '#e5e7eb'}` }}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopyalandı!' : 'HTML Kopyala'}
            </button>

            <button onClick={() => setTestMailOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#4470ff,#6c47ff)', color: '#fff', boxShadow: '0 4px 16px rgba(68,112,255,0.35)' }}>
              <Send className="w-3.5 h-3.5" /> Test Gönder
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Left Panel ── */}
          <div className="w-[320px] shrink-0 flex flex-col overflow-hidden"
            style={{ background: '#fff', borderRight: '1px solid rgba(0,0,0,0.07)' }}>
            <div className="flex-1 overflow-y-auto">

              {/* 1 — Product upload */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                  Ürün Görseli
                </p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {productImage ? (
                  <div className="relative rounded-xl overflow-hidden mb-3" style={{ border: '1.5px solid #e5e7eb' }}>
                    <img src={productImage} alt="Ürün" className="w-full h-32 object-contain" style={{ background: '#f9fafb' }} />
                    <button onClick={() => { setProductImage(null); setGeneratedBanners(null); if (fileRef.current) fileRef.current.value = '' }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-2 transition-all mb-3"
                    style={{ height: 96, border: '2px dashed #d1d5db', background: '#fafafa' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4470ff'; e.currentTarget.style.background = '#f0f4ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafafa' }}>
                    <Upload className="w-5 h-5" style={{ color: '#4470ff' }} />
                    <p className="text-[11px] font-semibold" style={{ color: '#374151' }}>Görsel yükle veya sürükle</p>
                  </button>
                )}

                <div>
                  <FieldLabel>Ürün Adı (opsiyonel)</FieldLabel>
                  <FieldInput value={productName} onChange={setProductName} placeholder="Nike Air Max, Chanel No.5..." />
                </div>
              </div>

              {/* 2 — Banner background styles */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                  Mail Banner Stili
                </p>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {BANNER_HERO_STYLES.map(style => {
                    const isActive = style.id === bannerStyle
                    return (
                      <button key={style.id} onClick={() => setBannerStyle(style.id)}
                        className="flex flex-col items-start p-2.5 rounded-xl text-left transition-all"
                        style={{
                          border:  isActive ? `2px solid ${style.accentColor}` : '1.5px solid #f3f4f6',
                          background: isActive ? `${style.accentColor}08` : '#fafafa',
                          boxShadow: isActive ? `0 0 0 3px ${style.accentColor}18` : 'none',
                          opacity: !productImage ? 0.5 : 1,
                        }}>
                        <div className="w-full h-12 rounded-lg overflow-hidden mb-1.5 relative">
                          <img src={style.previewImage} alt={style.name} className="w-full h-full object-cover"
                            style={{ opacity: isActive ? 1 : 0.65 }} />
                          {isActive && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: style.accentColor }}>
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]">{style.icon}</span>
                          <span className="text-[10px] font-semibold leading-tight"
                            style={{ color: isActive ? style.accentColor : '#374151' }}>
                            {style.name}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Description of selected style */}
                <p className="text-[11px] mb-3" style={{ color: '#6b7280' }}>
                  {bannerStyleDef.icon} <strong>{bannerStyleDef.name}:</strong> {bannerStyleDef.description}
                </p>

                {/* Generate button */}
                <button
                  onClick={generateBanner}
                  disabled={!productImage || generatingBanner}
                  className="w-full py-3 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: !productImage ? '#e5e7eb' : generatingBanner
                      ? 'linear-gradient(135deg,#a78bfa,#c084fc)'
                      : `linear-gradient(135deg,${bannerStyleDef.accentColor},${bannerStyleDef.accentColor}cc)`,
                    color: !productImage ? '#9ca3af' : '#fff',
                    boxShadow: productImage && !generatingBanner ? `0 6px 20px ${bannerStyleDef.accentColor}50` : 'none',
                    cursor: !productImage ? 'not-allowed' : 'pointer',
                  }}>
                  {generatingBanner
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Banner oluşturuluyor (3 boyut)...</>
                    : generatedBanners
                      ? <><RefreshCw className="w-4 h-4" /> Yeniden Oluştur</>
                      : <><Sparkles className="w-4 h-4" /> Banner Oluştur</>}
                </button>

                {!productImage && (
                  <div className="flex items-center gap-1.5 mt-2 justify-center">
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                    <p className="text-[11px]" style={{ color: '#9ca3af' }}>Önce ürün görseli yükleyin</p>
                  </div>
                )}

                {bannerError && (
                  <p className="text-[11px] mt-2 text-center" style={{ color: '#dc2626' }}>{bannerError}</p>
                )}

                {generatedBanners && (
                  <div className="mt-3 rounded-xl p-2.5 flex items-center gap-2"
                    style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Check className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />
                    <div>
                      <p className="text-[11px] font-semibold" style={{ color: '#166534' }}>Banner oluşturuldu!</p>
                      <p className="text-[10px]" style={{ color: '#16a34a' }}>
                        {[generatedBanners.desktop && 'Desktop', generatedBanners.mobile && 'Mobil', generatedBanners.square && 'Instagram'].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 — Email template selection */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                  Mail Şablonu
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {EMAIL_TEMPLATES.map(tpl => {
                    const Icon   = tpl.icon
                    const active = tpl.id === selectedTemplate
                    return (
                      <button key={tpl.id} onClick={() => selectTemplate(tpl.id)}
                        className="flex flex-col items-start p-2.5 rounded-xl text-left transition-all"
                        style={{
                          border: active ? `2px solid ${tpl.accentColor}` : '1.5px solid #f3f4f6',
                          background: active ? `${tpl.accentColor}08` : '#fafafa',
                          boxShadow: active ? `0 0 0 3px ${tpl.accentColor}18` : 'none',
                        }}>
                        <div className="w-full h-10 rounded-lg overflow-hidden mb-1.5 relative">
                          <img src={tpl.previewImage} alt={tpl.name} className="w-full h-full object-cover"
                            style={{ opacity: active ? 1 : 0.65 }} />
                          {active && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: tpl.accentColor }}>
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3 shrink-0" style={{ color: active ? tpl.accentColor : '#9ca3af' }} />
                          <span className="text-[10px] font-semibold leading-tight"
                            style={{ color: active ? tpl.accentColor : '#374151' }}>
                            {tpl.name}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 4 — Content editing */}
              <div className="p-4 space-y-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>İçerik Düzenle</p>

                <div><FieldLabel>Marka Adı</FieldLabel><FieldInput value={fields.brandName} onChange={setF('brandName')} placeholder="Marksio" /></div>
                <div><FieldLabel>Başlık</FieldLabel><FieldInput value={fields.title} onChange={setF('title')} placeholder="Email başlığı" /></div>
                <div><FieldLabel>Açıklama</FieldLabel><FieldInput value={fields.description} onChange={setF('description')} placeholder="Açıklama..." multiline /></div>

                <div className="grid grid-cols-2 gap-3">
                  <div><FieldLabel>Fiyat</FieldLabel><FieldInput value={fields.price} onChange={setF('price')} placeholder="₺299" /></div>
                  <div><FieldLabel>Orijinal Fiyat</FieldLabel><FieldInput value={fields.originalPrice} onChange={setF('originalPrice')} placeholder="₺599" /></div>
                </div>

                <div><FieldLabel>İndirim Oranı</FieldLabel><FieldInput value={fields.discount} onChange={setF('discount')} placeholder="%50" /></div>
                <div><FieldLabel>Kupon Kodu</FieldLabel><FieldInput value={fields.coupon} onChange={setF('coupon')} placeholder="KUPON20" /></div>
                <div><FieldLabel>CTA Butonu Metni</FieldLabel><FieldInput value={fields.cta} onChange={setF('cta')} placeholder="Alışverişe Başla" /></div>
                <div><FieldLabel>CTA Linki</FieldLabel><FieldInput value={fields.ctaUrl} onChange={setF('ctaUrl')} placeholder="https://..." /></div>
                <div><FieldLabel>Footer Metni</FieldLabel><FieldInput value={fields.footer} onChange={setF('footer')} placeholder="© 2025 Marka." /></div>
                <div><FieldLabel>Abonelikten Çık Linki</FieldLabel><FieldInput value={fields.unsubscribeUrl} onChange={setF('unsubscribeUrl')} placeholder="https://..." /></div>

                <div>
                  <FieldLabel>Marka Rengi</FieldLabel>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {BRAND_COLORS.map(c => (
                      <button key={c} onClick={() => setF('brandColor')(c)} className="rounded-full shrink-0 transition-all"
                        style={{ width: 22, height: 22, background: c, boxShadow: fields.brandColor === c ? `0 0 0 2px #fff,0 0 0 4px ${c}` : 'none' }} />
                    ))}
                    <input type="color" value={fields.brandColor} onChange={e => setF('brandColor')(e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer border-0" style={{ padding: 1, background: 'none' }} title="Özel renk" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className="flex-1 flex items-start justify-center overflow-auto p-8" style={{ background: '#eef0f5' }}>

            {/* Generation loading overlay */}
            {generatingBanner && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10"
                style={{ background: 'rgba(238,240,245,0.92)', backdropFilter: 'blur(4px)' }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg,${bannerStyleDef.accentColor},${bannerStyleDef.accentColor}99)`, boxShadow: `0 8px 32px ${bannerStyleDef.accentColor}50` }}>
                  <Sparkles className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-[16px] font-bold" style={{ color: '#111827' }}>
                    {bannerStyleDef.icon} {bannerStyleDef.name} Banner Oluşturuluyor
                  </p>
                  <p className="text-[13px] mt-1" style={{ color: '#6b7280' }}>
                    Desktop 1200×600 · Mobil 1080×1350 · Instagram 1080×1080
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>
                    Fal.ai flux-kontext ile ürün detayları korunarak sahneye entegre ediliyor...
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: bannerStyleDef.accentColor }} />
              </div>
            )}

            {previewMode === 'desktop' ? (
              <div className="w-full" style={{ maxWidth: 680 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                    Desktop Önizleme — 600px
                    {generatedBanners?.desktop && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>AI Banner ✓</span>}
                  </span>
                  <span className="text-[11px]" style={{ color: '#9ca3af' }}>{tplConfig.name}</span>
                </div>
                {/* Browser chrome */}
                <div className="rounded-t-xl overflow-hidden" style={{ background: '#e5e7eb', padding: '10px 12px 0' }}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
                    <div className="flex-1 mx-3 h-5 rounded-full" style={{ background: '#fff', border: '1px solid #d1d5db' }} />
                  </div>
                </div>
                <div style={{ background: '#f4f4f4', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
                  <iframe srcDoc={emailHtml} title="Email preview desktop"
                    style={{ display: 'block', width: '100%', minHeight: 500, border: 'none' }}
                    sandbox="allow-same-origin"
                    onLoad={e => { const d = e.currentTarget.contentDocument; if (d) e.currentTarget.style.height = d.documentElement.scrollHeight + 'px' }} />
                </div>
              </div>

            ) : previewMode === 'mobile' ? (
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                    Mobile Önizleme — 375px
                    {generatedBanners?.mobile && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>AI Banner ✓</span>}
                  </span>
                </div>
                {/* Phone mockup */}
                <div style={{ width: 390, background: '#1c1c1e', borderRadius: 48, padding: '14px 10px', boxShadow: '0 30px 80px rgba(0,0,0,0.4),inset 0 0 0 2px rgba(255,255,255,0.12)' }}>
                  <div className="flex justify-center mb-2">
                    <div style={{ width: 100, height: 28, background: '#000', borderRadius: 20 }} />
                  </div>
                  <div style={{ borderRadius: 36, overflow: 'hidden', background: '#f4f4f4' }}>
                    <div style={{ background: '#fff', padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: fields.brandColor }}>
                          {(fields.brandName || 'M')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold" style={{ color: '#111' }}>{fields.brandName || 'Marka'}</p>
                          <p className="text-[9px]" style={{ color: '#9ca3af' }}>info@{(fields.brandName || 'marka').toLowerCase().replace(/\s+/g, '')}.com</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#f4f4f4', padding: 8, maxHeight: 560, overflow: 'hidden' }}>
                      <iframe srcDoc={emailHtml} title="Mobile preview"
                        style={{ display: 'block', width: '100%', height: 540, border: 'none', borderRadius: 8, background: '#fff' }}
                        sandbox="allow-same-origin" />
                    </div>
                  </div>
                  <div className="flex justify-center mt-2">
                    <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>

            ) : (
              /* Instagram square preview */
              <div className="flex flex-col items-center">
                <div className="mb-3">
                  <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                    Instagram 1080×1080
                    {generatedBanners?.square && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>AI Banner ✓</span>}
                  </span>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ width: 400, height: 400, border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
                  {generatedBanners?.square ? (
                    <img src={generatedBanners.square} alt="Instagram" className="w-full h-full object-cover" />
                  ) : productImage ? (
                    <img src={productImage} alt="Ürün" className="w-full h-full object-contain" style={{ background: '#f9fafb' }} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3"
                      style={{ background: 'linear-gradient(135deg,#f3f4f6,#e5e7eb)' }}>
                      <Instagram className="w-12 h-12" style={{ color: '#d1d5db' }} />
                      <p className="text-[13px] font-semibold" style={{ color: '#9ca3af' }}>Instagram görseli</p>
                      <p className="text-[11px] text-center px-8" style={{ color: '#9ca3af' }}>Banner oluşturulduktan sonra görünür</p>
                    </div>
                  )}
                </div>
                <p className="text-[11px] mt-3 text-center" style={{ color: '#9ca3af' }}>
                  {generatedBanners?.square ? 'AI tarafından üretildi · İndirmek için sağ tık yapın' : 'Banner oluşturunca burada görünür'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
