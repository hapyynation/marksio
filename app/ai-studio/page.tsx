'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  Upload, X, Check, Code2, Send, Mail, Monitor, Smartphone,
  ChevronDown, Loader2, Copy, Sparkles, Tag, ShoppingCart,
  Star, Zap, Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

type TemplateId = 'indirim' | 'yeniurun' | 'sepetterk' | 'premium' | 'blackfriday' | 'minimal'
type PreviewMode = 'desktop' | 'mobile'

interface EmailFields {
  title: string
  description: string
  discount: string
  productImage: string | null
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

interface TemplateConfig {
  id: TemplateId
  name: string
  description: string
  icon: React.ElementType
  previewImage: string
  defaults: Partial<EmailFields>
  accentColor: string
  dark?: boolean
}

// ─── Templates ───────────────────────────────────────────────────────────────

const TEMPLATES: TemplateConfig[] = [
  {
    id: 'indirim',
    name: 'İndirim Maili',
    description: 'Büyük indirim duyurusu, fiyat karşılaştırması ve kupon kodu',
    icon: Tag,
    previewImage: '/templates/email-indirim.jpeg',
    accentColor: '#e84545',
    defaults: {
      title: 'BÜYÜK YAZI İNDİRİMİ!',
      description: 'Seçili ürünlerde sınırlı süre geçerli fırsatı kaçırmayın.',
      discount: '%50',
      price: '₺299',
      originalPrice: '₺599',
      coupon: 'INDIRIM50',
      cta: 'Hemen Alışveriş Yap',
      footer: '© 2025 Marksio. Tüm hakları saklıdır.',
    },
  },
  {
    id: 'yeniurun',
    name: 'Yeni Ürün Tanıtımı',
    description: 'Yeni koleksiyon veya ürün lansmanı için ideal',
    icon: Sparkles,
    previewImage: '/templates/email-yeniurun.jpeg',
    accentColor: '#4470ff',
    defaults: {
      title: 'YENİ KOLEKSİYON GELDİ',
      description: 'Sezonun en yeni parçaları mağazamızda. Şimdi keşfet.',
      discount: '',
      price: '₺449',
      originalPrice: '',
      coupon: '',
      cta: 'Koleksiyonu Keşfet',
      footer: '© 2025 Marksio. Tüm hakları saklıdır.',
    },
  },
  {
    id: 'sepetterk',
    name: 'Sepet Terk Maili',
    description: 'Sepeti terk eden müşterileri geri kazanın',
    icon: ShoppingCart,
    previewImage: '/templates/email-sepetterk.jpeg',
    accentColor: '#f0a020',
    defaults: {
      title: 'Sepetinizde ürün var!',
      description: 'Seçtiğiniz ürünler sizi bekliyor. Stoklar sınırlı, kaçırmayın!',
      discount: '%10',
      price: '₺349',
      originalPrice: '₺389',
      coupon: 'GERI10',
      cta: 'Alışverişi Tamamla',
      footer: '© 2025 Marksio. Tüm hakları saklıdır.',
    },
  },
  {
    id: 'premium',
    name: 'Premium Lansman',
    description: 'Lüks ve premium ürünler için koyu tasarım',
    icon: Star,
    previewImage: '/templates/email-premium.jpeg',
    accentColor: '#c9a227',
    dark: true,
    defaults: {
      title: 'EXCLUSIVE COLLECTION',
      description: 'Sınırlı sayıda üretilen, özel tasarım koleksiyonumuz sizlerle.',
      discount: '',
      price: '₺2.490',
      originalPrice: '',
      coupon: 'VIP2025',
      cta: 'Exclusive Koleksiyona Ulaş',
      footer: '© 2025 Marksio. Tüm hakları saklıdır.',
    },
  },
  {
    id: 'blackfriday',
    name: 'Black Friday Kampanyası',
    description: 'Efsane cuma ve özel kampanya tasarımı',
    icon: Zap,
    previewImage: '/templates/email-blackfriday.jpeg',
    accentColor: '#ffffff',
    dark: true,
    defaults: {
      title: 'BLACK FRIDAY',
      description: 'Yılın en büyük indirimi başladı. Sınırlı stok!',
      discount: '%70',
      price: '₺199',
      originalPrice: '₺669',
      coupon: 'BF2025',
      cta: 'Fırsatı Yakala',
      footer: '© 2025 Marksio. Tüm hakları saklıdır.',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal E-Ticaret',
    description: 'Sade ve şık, ürünü ön plana çıkaran tasarım',
    icon: Package,
    previewImage: '/templates/email-minimal.jpeg',
    accentColor: '#111827',
    defaults: {
      title: 'Sizin için seçtik',
      description: 'Özenle tasarlanmış, kaliteyi hissettiren ürünler.',
      discount: '',
      price: '₺850',
      originalPrice: '',
      coupon: '',
      cta: 'İncele',
      footer: '© 2025 Marksio. Tüm hakları saklıdır.',
    },
  },
]

const DEFAULT_FIELDS: EmailFields = {
  title: 'Başlık',
  description: 'Açıklama metni buraya gelecek.',
  discount: '%50',
  productImage: null,
  price: '₺299',
  originalPrice: '₺599',
  coupon: 'KUPON20',
  cta: 'Alışverişe Başla',
  ctaUrl: '#',
  footer: '© 2025 Marksio. Tüm hakları saklıdır.',
  unsubscribeUrl: '#',
  brandName: 'Marksio',
  brandColor: '#4470ff',
}

// ─── HTML Email Generators ────────────────────────────────────────────────────

function heroImg(productImage: string | null, defaultSrc: string, alt: string) {
  const src = productImage ?? defaultSrc
  return `<tr>
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${src}" width="600" alt="${alt}"
      style="display:block;width:100%;max-width:600px;height:auto;min-height:260px;object-fit:cover;border:0;outline:none;-ms-interpolation-mode:bicubic;">
  </td>
</tr>`
}

function productCard(productImage: string | null, defaultSrc: string, alt: string) {
  const src = productImage ?? defaultSrc
  return `<img src="${src}" width="200" alt="${alt}"
    style="display:block;width:200px;max-width:200px;height:200px;object-fit:contain;border:0;outline:none;background:#f9fafb;border-radius:12px;">`
}

function couponBox(code: string, accentColor: string) {
  if (!code) return ''
  return `<tr>
  <td style="padding:0 40px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:14px 20px;border:2px dashed ${accentColor};border-radius:10px;text-align:center;background:${accentColor}0d;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${accentColor};font-family:'Inter','Helvetica Neue',Arial,sans-serif;">Kupon Kodunuz</p>
          <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:5px;color:${accentColor};font-family:'Courier New',Courier,monospace;">${code}</p>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

function ctaRow(cta: string, ctaUrl: string, accentColor: string, textColor = '#ffffff') {
  return `<tr>
  <td style="padding:0 40px 32px;text-align:center;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td bgcolor="${accentColor}" style="border-radius:12px;background-color:${accentColor};">
          <a href="${ctaUrl || '#'}"
            style="display:block;padding:16px 40px;font-size:14px;font-weight:700;color:${textColor};text-decoration:none;letter-spacing:0.04em;font-family:'Inter','Helvetica Neue',Arial,sans-serif;white-space:nowrap;mso-padding-alt:16px 40px;"
          >${cta} →</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`
}

function footerRow(brandName: string, footer: string, unsubscribeUrl: string, accentColor: string, bgColor = '#f8f9fa') {
  return `<tr>
  <td bgcolor="${bgColor}" style="padding:16px 40px 20px;text-align:center;background-color:${bgColor};">
    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
      ${footer || `© 2025 ${brandName}. Tüm hakları saklıdır.`}
    </p>
    <p style="margin:0;font-size:11px;color:#9ca3af;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
      Bu emaili almak istemiyorsanız&nbsp;<a href="${unsubscribeUrl || '#'}" style="color:${accentColor};text-decoration:none;">aboneliğinizi iptal edin</a>.
    </p>
  </td>
</tr>`
}

function emailWrapper(content: string, bgColor = '#f0f2f5') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>Email</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
@media(max-width:480px){
  .em-container{border-radius:12px!important}
  .em-pad{padding-left:20px!important;padding-right:20px!important}
  .em-hero img{min-height:180px!important}
  .em-title{font-size:22px!important;line-height:1.2!important}
  .em-price-big{font-size:28px!important}
  .em-discount-big{font-size:52px!important}
  .em-cta a{padding:13px 24px!important;font-size:13px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${bgColor};font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
  style="background-color:${bgColor};padding:24px 0;">
<tr><td align="center" style="padding:0 12px;">
<table class="em-container" role="presentation" width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;background-color:#ffffff;">
${content}
</table>
</td></tr>
</table>
</body>
</html>`
}

function generateIndirim(f: EmailFields): string {
  const a = f.brandColor || '#e84545'
  const body = `
<tr><td bgcolor="${a}" height="5" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td></tr>
<tr class="em-hero">
  <td style="padding:0;line-height:0;font-size:0;position:relative;">
    <img src="${f.productImage ?? '/templates/email-indirim.jpeg'}" width="600" alt="${f.title}"
      style="display:block;width:100%;max-width:600px;height:300px;object-fit:cover;border:0;outline:none;-ms-interpolation-mode:bicubic;">
    ${f.discount ? `<div style="position:absolute;top:20px;right:20px;background:${a};color:#fff;font-size:22px;font-weight:900;padding:12px 18px;border-radius:12px;font-family:'Inter',Arial,sans-serif;line-height:1;">${f.discount}<br><span style="font-size:10px;font-weight:600;letter-spacing:1px;display:block;text-align:center;margin-top:2px;">İNDİRİM</span></div>` : ''}
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:28px 40px 0;">
    <p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">${f.brandName || 'Marka'}</p>
    <h1 class="em-title" style="margin:0 0 10px;font-size:28px;font-weight:900;color:#111827;letter-spacing:-0.025em;line-height:1.15;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;line-height:1.55;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        ${f.originalPrice ? `<td style="font-size:16px;font-weight:400;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:12px;">${f.originalPrice}</td>` : ''}
        <td class="em-price-big" style="font-size:36px;font-weight:900;color:${a};letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;">${f.price}</td>
      </tr>
    </table>
  </td>
</tr>
${f.coupon ? `<tr><td class="em-pad" style="padding:0 40px 20px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:14px 20px;border:2px dashed ${a};border-radius:10px;text-align:center;background:${a}0d;">
        <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">Kupon Kodunuz</p>
        <p style="margin:0;font-size:22px;font-weight:900;letter-spacing:5px;color:${a};font-family:'Courier New',Courier,monospace;">${f.coupon}</p>
      </td>
    </tr>
  </table>
</td></tr>` : ''}
${ctaRow(f.cta, f.ctaUrl, a)}
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`
  return emailWrapper(body)
}

function generateYeniUrun(f: EmailFields): string {
  const a = f.brandColor || '#4470ff'
  const body = `
<tr><td bgcolor="${a}" style="padding:20px 40px;background-color:${a};">
  <table role="presentation" cellpadding="0" cellspacing="0">
    <tr>
      <td style="border-radius:20px;padding:4px 14px;background:rgba(255,255,255,0.2);">
        <span style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;font-family:'Inter',Arial,sans-serif;">✨ YENİ ÜRÜN</span>
      </td>
    </tr>
  </table>
  <p style="margin:8px 0 0;font-size:20px;font-weight:700;color:#ffffff;font-family:'Inter',Arial,sans-serif;">${f.brandName || 'Marka'}</p>
</td></tr>
<tr>
  <td style="padding:32px 40px;text-align:center;background-color:#f9fafb;">
    <img src="${f.productImage ?? '/templates/email-yeniurun.jpeg'}" width="280" alt="${f.title}"
      style="display:block;width:280px;max-width:100%;height:260px;object-fit:contain;margin:0 auto;border:0;outline:none;filter:drop-shadow(0 16px 40px rgba(0,0,0,0.15));">
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:28px 40px 0;">
    <h1 class="em-title" style="margin:0 0 10px;font-size:26px;font-weight:900;color:#111827;letter-spacing:-0.025em;line-height:1.15;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.55;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
    <p style="margin:0 0 24px;font-size:32px;font-weight:900;color:${a};letter-spacing:-0.03em;font-family:'Inter',Arial,sans-serif;">${f.price}</p>
  </td>
</tr>
${ctaRow(f.cta, f.ctaUrl, a)}
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`
  return emailWrapper(body)
}

function generateSepetTerk(f: EmailFields): string {
  const a = f.brandColor || '#f0a020'
  const body = `
<tr><td bgcolor="${a}" height="5" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td></tr>
<tr>
  <td class="em-pad" style="padding:24px 40px 16px;">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${a};font-family:'Inter',Arial,sans-serif;">🛒 Sepetiniz Sizi Bekliyor</p>
    <h1 class="em-title" style="margin:0;font-size:24px;font-weight:900;color:#111827;letter-spacing:-0.025em;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:0 40px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="background:#f9fafb;border-radius:14px;overflow:hidden;">
      <tr>
        <td width="140" style="padding:16px;vertical-align:middle;">
          <img src="${f.productImage ?? '/templates/email-sepetterk.jpeg'}" width="108" alt="${f.title}"
            style="display:block;width:108px;height:108px;object-fit:contain;border:0;background:#fff;border-radius:10px;">
        </td>
        <td style="padding:16px 16px 16px 0;vertical-align:middle;">
          <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#111827;font-family:'Inter',Arial,sans-serif;">${f.title}</p>
          <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.5;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              ${f.originalPrice ? `<td style="font-size:13px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:8px;">${f.originalPrice}</td>` : ''}
              <td style="font-size:20px;font-weight:900;color:${a};font-family:'Inter',Arial,sans-serif;">${f.price}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:0 40px 20px;text-align:center;">
    <p style="margin:0;font-size:13px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">⏰ Stok tükenmeden tamamlayın!</p>
  </td>
</tr>
${f.coupon ? `<tr><td class="em-pad" style="padding:0 40px 20px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:12px 20px;border:2px dashed ${a};border-radius:10px;text-align:center;background:${a}0d;">
        <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">Ekstra ${f.discount} İndirim Kodu</p>
        <p style="margin:0;font-size:20px;font-weight:900;letter-spacing:4px;color:${a};font-family:'Courier New',Courier,monospace;">${f.coupon}</p>
      </td>
    </tr>
  </table>
</td></tr>` : ''}
${ctaRow(f.cta, f.ctaUrl, a)}
${footerRow(f.brandName, f.footer, f.unsubscribeUrl, a)}`
  return emailWrapper(body)
}

function generatePremium(f: EmailFields): string {
  const a = f.brandColor || '#c9a227'
  const body = `
<tr>
  <td style="padding:0;line-height:0;font-size:0;">
    <img src="${f.productImage ?? '/templates/email-premium.jpeg'}" width="600" alt="${f.title}"
      style="display:block;width:100%;max-width:600px;height:320px;object-fit:cover;border:0;outline:none;-ms-interpolation-mode:bicubic;">
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:32px 40px 28px;background-color:#0d0d14;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="border-radius:20px;padding:5px 14px;background:${a}22;border:1px solid ${a}44;">
          <span style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">EXCLUSIVE LAUNCH</span>
        </td>
      </tr>
    </table>
    <h1 class="em-title" style="margin:0 0 12px;font-size:30px;font-weight:900;color:#f5f0e8;letter-spacing:-0.02em;line-height:1.15;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#8b8b9e;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
    ${f.coupon ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:10px 18px;border:1px solid ${a}55;border-radius:8px;background:${a}11;">
          <span style="font-size:10px;color:#8b8b9e;font-family:'Inter',Arial,sans-serif;">VIP Kodu: </span>
          <span style="font-size:14px;font-weight:700;letter-spacing:3px;color:${a};font-family:'Courier New',Courier,monospace;">${f.coupon}</span>
        </td>
      </tr>
    </table>` : ''}
    <p style="margin:0 0 24px;font-size:34px;font-weight:900;color:${a};letter-spacing:-0.03em;font-family:'Inter',Arial,sans-serif;">${f.price}</p>
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-radius:12px;background-color:${a};">
          <a href="${f.ctaUrl || '#'}"
            style="display:block;padding:16px 36px;font-size:13px;font-weight:700;color:#0d0d14;text-decoration:none;letter-spacing:0.06em;font-family:'Inter',Arial,sans-serif;white-space:nowrap;mso-padding-alt:16px 36px;"
          >${f.cta} →</a>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:14px 40px 16px;text-align:center;background-color:#08080f;">
    <p style="margin:0 0 4px;font-size:11px;color:#3e3e54;font-family:'Inter',Arial,sans-serif;">
      ${f.footer || `© 2025 ${f.brandName}. Tüm hakları saklıdır.`}
    </p>
    <p style="margin:0;font-size:11px;color:#3e3e54;font-family:'Inter',Arial,sans-serif;">
      Bu emaili almak istemiyorsanız&nbsp;<a href="${f.unsubscribeUrl || '#'}" style="color:${a};text-decoration:none;">aboneliğinizi iptal edin</a>.
    </p>
  </td>
</tr>`
  return emailWrapper(body, '#0a0a10')
}

function generateBlackFriday(f: EmailFields): string {
  const a = '#ffffff'
  const body = `
<tr>
  <td class="em-pad" style="padding:32px 40px 0;background-color:#000000;text-align:center;">
    <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:4px;color:#666;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">— ${f.brandName || 'Marksio'} —</p>
    <h1 style="margin:8px 0;font-size:48px;font-weight:900;color:#ffffff;letter-spacing:-0.03em;line-height:1;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">${f.title}</h1>
    ${f.discount ? `<p class="em-discount-big" style="margin:0 0 4px;font-size:80px;font-weight:900;color:#ffffff;letter-spacing:-0.05em;line-height:1;font-family:'Inter',Arial,sans-serif;">${f.discount}</p>
    <p style="margin:0 0 0;font-size:12px;font-weight:700;letter-spacing:3px;color:#555;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">İNDİRİM</p>` : ''}
  </td>
</tr>
<tr>
  <td style="padding:24px 0 0;background-color:#000000;text-align:center;line-height:0;font-size:0;">
    <img src="${f.productImage ?? '/templates/email-blackfriday.jpeg'}" width="600" alt="${f.title}"
      style="display:block;width:100%;max-width:600px;height:280px;object-fit:cover;border:0;outline:none;opacity:0.85;">
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:24px 40px 20px;background-color:#000000;">
    <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;line-height:1.55;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        ${f.originalPrice ? `<td style="font-size:16px;font-weight:400;color:#555;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:12px;">${f.originalPrice}</td>` : ''}
        <td style="font-size:36px;font-weight:900;color:#ffffff;letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;">${f.price}</td>
      </tr>
    </table>
    ${f.coupon ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:10px 18px;border:2px dashed rgba(255,255,255,0.25);border-radius:8px;background:rgba(255,255,255,0.05);">
          <span style="font-size:10px;color:#666;font-family:'Inter',Arial,sans-serif;letter-spacing:1px;">KOD: </span>
          <span style="font-size:18px;font-weight:900;letter-spacing:4px;color:#fff;font-family:'Courier New',Courier,monospace;">${f.coupon}</span>
        </td>
      </tr>
    </table>` : ''}
  </td>
</tr>
<tr>
  <td style="padding:0 40px 32px;text-align:center;background-color:#000000;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:12px;background-color:#ffffff;">
          <a href="${f.ctaUrl || '#'}"
            style="display:block;padding:16px 40px;font-size:14px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.04em;font-family:'Inter',Arial,sans-serif;white-space:nowrap;"
          >${f.cta} →</a>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:14px 40px 16px;text-align:center;background-color:#0a0a0a;border-top:1px solid #1a1a1a;">
    <p style="margin:0 0 4px;font-size:11px;color:#444;font-family:'Inter',Arial,sans-serif;">
      ${f.footer || `© 2025 ${f.brandName}. Tüm hakları saklıdır.`}
    </p>
    <p style="margin:0;font-size:11px;color:#444;font-family:'Inter',Arial,sans-serif;">
      Bu emaili almak istemiyorsanız&nbsp;<a href="${f.unsubscribeUrl || '#'}" style="color:#888;text-decoration:none;">aboneliğinizi iptal edin</a>.
    </p>
  </td>
</tr>`
  return emailWrapper(body, '#0a0a0a')
}

function generateMinimal(f: EmailFields): string {
  const a = f.brandColor || '#111827'
  const body = `
<tr>
  <td class="em-pad" style="padding:28px 40px 20px;border-bottom:1px solid #f3f4f6;">
    <p style="margin:0;font-size:14px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">${f.brandName || 'Marka'}</p>
  </td>
</tr>
<tr>
  <td style="padding:32px 40px;text-align:center;background-color:#fafafa;">
    <img src="${f.productImage ?? '/templates/email-minimal.jpeg'}" width="320" alt="${f.title}"
      style="display:block;width:320px;max-width:100%;height:280px;object-fit:contain;margin:0 auto;border:0;outline:none;">
  </td>
</tr>
<tr>
  <td class="em-pad" style="padding:28px 40px 0;border-top:1px solid #f3f4f6;">
    <h1 class="em-title" style="margin:0 0 10px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.015em;line-height:1.2;font-family:'Inter',Arial,sans-serif;">${f.title}</h1>
    <p style="margin:0 0 18px;font-size:14px;color:#6b7280;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        ${f.originalPrice ? `<td style="font-size:14px;font-weight:400;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:10px;">${f.originalPrice}</td>` : ''}
        <td style="font-size:28px;font-weight:700;color:#111827;letter-spacing:-0.025em;font-family:'Inter',Arial,sans-serif;">${f.price}</td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="border-radius:10px;border:2px solid ${a};">
          <a href="${f.ctaUrl || '#'}"
            style="display:block;padding:14px 36px;font-size:13px;font-weight:600;color:${a};text-decoration:none;letter-spacing:0.04em;font-family:'Inter',Arial,sans-serif;white-space:nowrap;"
          >${f.cta}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>
<tr>
  <td style="padding:16px 40px 20px;text-align:center;border-top:1px solid #f3f4f6;">
    <p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;">
      ${f.footer || `© 2025 ${f.brandName}. Tüm hakları saklıdır.`}
    </p>
    <p style="margin:0;font-size:11px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;">
      <a href="${f.unsubscribeUrl || '#'}" style="color:#9ca3af;text-decoration:underline;">Aboneliği iptal et</a>
    </p>
  </td>
</tr>`
  return emailWrapper(body)
}

function generateEmail(templateId: TemplateId, fields: EmailFields): string {
  switch (templateId) {
    case 'indirim':     return generateIndirim(fields)
    case 'yeniurun':    return generateYeniUrun(fields)
    case 'sepetterk':   return generateSepetTerk(fields)
    case 'premium':     return generatePremium(fields)
    case 'blackfriday': return generateBlackFriday(fields)
    case 'minimal':     return generateMinimal(fields)
  }
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>
      {children}
    </label>
  )
}

function FieldInput({
  value, onChange, placeholder, type = 'text', multiline,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; multiline?: boolean
}) {
  const style: React.CSSProperties = {
    width: '100%', padding: '9px 12px', background: '#f9fafb',
    border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12,
    color: '#111827', outline: 'none', resize: multiline ? 'vertical' : 'none',
    fontFamily: 'inherit',
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        style={style}
        onFocus={e => (e.currentTarget.style.borderColor = '#4470ff')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    )
  }
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={style}
      onFocus={e => (e.currentTarget.style.borderColor = '#4470ff')}
      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
    />
  )
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), bannerHtml: html, storeName: brandName }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSent(true)
    } catch (e) { setErr((e as Error).message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="w-[360px] rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <p className="text-[14px] font-bold" style={{ color: '#111827' }}>Test Mail Gönder</p>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
        </div>
        <div className="p-5">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3"
                style={{ background: '#f0fdf4' }}>
                <Check className="w-6 h-6" style={{ color: '#16a34a' }} />
              </div>
              <p className="text-[14px] font-bold mb-3" style={{ color: '#111827' }}>Gönderildi!</p>
              <button onClick={onClose} className="px-5 py-2 rounded-xl text-[12px] font-semibold"
                style={{ background: '#f5f3ff', color: '#4470ff' }}>
                Kapat
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <FieldLabel>E-posta Adresi</FieldLabel>
                <FieldInput value={email} onChange={setEmail} placeholder="ornek@mail.com" type="email" />
              </div>
              {err && <p className="text-[11px]" style={{ color: '#dc2626' }}>{err}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>
                  İptal
                </button>
                <button onClick={send} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg,#4470ff,#6c47ff)', color: '#fff' }}>
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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('indirim')
  const [fields, setFields] = useState<EmailFields>({ ...DEFAULT_FIELDS })
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')
  const [copied, setCopied] = useState(false)
  const [testMailOpen, setTestMailOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const tplConfig = TEMPLATES.find(t => t.id === selectedTemplate)!
  const html = generateEmail(selectedTemplate, { ...fields, brandColor: fields.brandColor || tplConfig.accentColor })

  const setF = useCallback(<K extends keyof EmailFields>(k: K) => (v: EmailFields[K]) => {
    setFields(p => ({ ...p, [k]: v }))
  }, [])

  function selectTemplate(id: TemplateId) {
    const tpl = TEMPLATES.find(t => t.id === id)!
    setSelectedTemplate(id)
    setFields(p => ({
      ...p,
      ...tpl.defaults,
      brandColor: tpl.accentColor,
      productImage: p.productImage,
    }))
  }

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => setF('productImage')(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function copyHTML() {
    navigator.clipboard.writeText(html).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <AppShell>
      {testMailOpen && (
        <TestMailModal
          html={html}
          onClose={() => setTestMailOpen(false)}
          brandName={fields.brandName}
        />
      )}

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
              <p className="text-[14px] font-bold leading-tight" style={{ color: '#111827' }}>
                Email Şablon Builder
              </p>
              <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                {tplConfig.name} seçili
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop / Mobile toggle */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ background: '#f3f4f6' }}>
              {([['desktop', Monitor, 'Desktop'], ['mobile', Smartphone, 'Mobil']] as [PreviewMode, React.ElementType, string][])
                .map(([mode, Icon, label]) => (
                  <button key={mode} onClick={() => setPreviewMode(mode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{
                      background: previewMode === mode ? '#fff' : 'transparent',
                      color: previewMode === mode ? '#4470ff' : '#9ca3af',
                      boxShadow: previewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
            </div>

            {/* Actions */}
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

              {/* Template selection */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                  Şablon Seç
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(tpl => {
                    const Icon = tpl.icon
                    const isActive = tpl.id === selectedTemplate
                    return (
                      <button key={tpl.id} onClick={() => selectTemplate(tpl.id)}
                        className="flex flex-col items-start p-3 rounded-xl text-left transition-all"
                        style={{
                          border: isActive ? `2px solid ${tpl.accentColor}` : '1.5px solid #f3f4f6',
                          background: isActive ? `${tpl.accentColor}08` : '#fafafa',
                          boxShadow: isActive ? `0 0 0 3px ${tpl.accentColor}18` : 'none',
                        }}>
                        <div className="w-full h-14 rounded-lg overflow-hidden mb-2 relative"
                          style={{ background: '#f3f4f6' }}>
                          <img
                            src={tpl.previewImage}
                            alt={tpl.name}
                            className="w-full h-full object-cover"
                            style={{ opacity: isActive ? 1 : 0.7 }}
                          />
                          {isActive && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: tpl.accentColor }}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon className="w-3 h-3 shrink-0" style={{ color: isActive ? tpl.accentColor : '#9ca3af' }} />
                          <span className="text-[11px] font-semibold leading-tight"
                            style={{ color: isActive ? tpl.accentColor : '#374151' }}>
                            {tpl.name}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Product image upload */}
              <div className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                  Ürün Görseli
                </p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                {fields.productImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb' }}>
                    <img src={fields.productImage} alt="Ürün" className="w-full h-40 object-contain"
                      style={{ background: '#f9fafb' }} />
                    <button
                      onClick={() => setF('productImage')(null)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: 'rgba(68,112,255,0.9)', color: '#fff' }}>
                      ✓ Hero alana yerleşti
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                    style={{ height: 112, border: '2px dashed #d1d5db', background: '#fafafa' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4470ff'; e.currentTarget.style.background = '#f0f4ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafafa' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: '#eff2ff' }}>
                      <Upload className="w-5 h-5" style={{ color: '#4470ff' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                        Görsel yükle veya sürükle
                      </p>
                      <p className="text-[10px]" style={{ color: '#9ca3af' }}>
                        Hero alana otomatik yerleşir
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Edit fields */}
              <div className="p-4 space-y-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
                  İçerik Düzenle
                </p>

                <div>
                  <FieldLabel>Marka Adı</FieldLabel>
                  <FieldInput value={fields.brandName} onChange={setF('brandName')} placeholder="Marksio" />
                </div>

                <div>
                  <FieldLabel>Başlık</FieldLabel>
                  <FieldInput value={fields.title} onChange={setF('title')} placeholder="E-posta başlığı" />
                </div>

                <div>
                  <FieldLabel>Açıklama</FieldLabel>
                  <FieldInput value={fields.description} onChange={setF('description')} placeholder="Açıklama metni..." multiline />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Fiyat</FieldLabel>
                    <FieldInput value={fields.price} onChange={setF('price')} placeholder="₺299" />
                  </div>
                  <div>
                    <FieldLabel>Orijinal Fiyat</FieldLabel>
                    <FieldInput value={fields.originalPrice} onChange={setF('originalPrice')} placeholder="₺599" />
                  </div>
                </div>

                <div>
                  <FieldLabel>İndirim Oranı</FieldLabel>
                  <FieldInput value={fields.discount} onChange={setF('discount')} placeholder="%50" />
                </div>

                <div>
                  <FieldLabel>Kupon Kodu</FieldLabel>
                  <FieldInput value={fields.coupon} onChange={setF('coupon')} placeholder="KUPON20" />
                </div>

                <div>
                  <FieldLabel>CTA Butonu Metni</FieldLabel>
                  <FieldInput value={fields.cta} onChange={setF('cta')} placeholder="Alışverişe Başla" />
                </div>

                <div>
                  <FieldLabel>CTA Linki</FieldLabel>
                  <FieldInput value={fields.ctaUrl} onChange={setF('ctaUrl')} placeholder="https://..." />
                </div>

                <div>
                  <FieldLabel>Footer Metni</FieldLabel>
                  <FieldInput value={fields.footer} onChange={setF('footer')} placeholder="© 2025 Marka." />
                </div>

                <div>
                  <FieldLabel>Abonelikten Çık Linki</FieldLabel>
                  <FieldInput value={fields.unsubscribeUrl} onChange={setF('unsubscribeUrl')} placeholder="https://..." />
                </div>

                <div>
                  <FieldLabel>Marka Rengi</FieldLabel>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {BRAND_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setF('brandColor')(c)}
                        className="rounded-full shrink-0 transition-all"
                        style={{
                          width: 22, height: 22, background: c,
                          boxShadow: fields.brandColor === c
                            ? `0 0 0 2px #fff, 0 0 0 4px ${c}`
                            : 'none',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={fields.brandColor}
                      onChange={e => setF('brandColor')(e.target.value)}
                      className="w-6 h-6 rounded-full cursor-pointer border-0"
                      style={{ padding: 1, background: 'none' }}
                      title="Özel renk"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Preview Panel ── */}
          <div className="flex-1 flex items-start justify-center overflow-auto p-8"
            style={{ background: '#eef0f5' }}>

            {previewMode === 'desktop' ? (
              <div className="w-full" style={{ maxWidth: 680 }}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                    Desktop Önizleme — 600px
                  </span>
                  <span className="text-[11px]" style={{ color: '#9ca3af' }}>
                    {tplConfig.name}
                  </span>
                </div>
                {/* Browser chrome mockup */}
                <div className="rounded-t-xl overflow-hidden"
                  style={{ background: '#e5e7eb', padding: '10px 12px 0' }}>
                  <div className="flex items-center gap-1.5 mb-2.5">
                    {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                      <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                    ))}
                    <div className="flex-1 mx-3 h-5 rounded-full"
                      style={{ background: '#fff', border: '1px solid #d1d5db' }} />
                  </div>
                </div>
                <div style={{ background: '#f4f4f4', borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
                  <iframe
                    srcDoc={html}
                    title="Email preview"
                    style={{
                      display: 'block',
                      width: '100%',
                      minHeight: 500,
                      border: 'none',
                    }}
                    sandbox="allow-same-origin"
                    onLoad={e => {
                      const iframe = e.currentTarget
                      const doc = iframe.contentDocument
                      if (doc) {
                        iframe.style.height = doc.documentElement.scrollHeight + 'px'
                      }
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                    Mobile Önizleme — 375px
                  </span>
                </div>
                {/* Phone mockup */}
                <div style={{
                  width: 390,
                  background: '#1c1c1e',
                  borderRadius: 48,
                  padding: '14px 10px',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(255,255,255,0.12)',
                }}>
                  {/* Notch */}
                  <div className="flex justify-center mb-2">
                    <div style={{ width: 100, height: 28, background: '#000', borderRadius: 20 }} />
                  </div>
                  <div style={{ borderRadius: 36, overflow: 'hidden', background: '#f4f4f4' }}>
                    {/* Email client header */}
                    <div style={{ background: '#fff', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ background: fields.brandColor }}>
                          {(fields.brandName || 'M')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold" style={{ color: '#111' }}>{fields.brandName || 'Marka'}</p>
                          <p className="text-[10px]" style={{ color: '#9ca3af' }}>info@{(fields.brandName || 'marka').toLowerCase().replace(/\s+/g, '')}.com</p>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#f4f4f4', padding: 8, maxHeight: 560, overflow: 'hidden' }}>
                      <iframe
                        srcDoc={html}
                        title="Mobile preview"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: 540,
                          border: 'none',
                          borderRadius: 8,
                          background: '#fff',
                        }}
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                  {/* Home bar */}
                  <div className="flex justify-center mt-2">
                    <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
