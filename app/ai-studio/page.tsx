'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  Upload, X, Check, Send, Mail, Monitor, Smartphone, Link2,
  ShoppingBag, Loader2, Copy, Sparkles, Tag, ShoppingCart,
  Star, Zap, Package, RefreshCw, AlertCircle, Search, Users,
  Eye, Pencil, Type, MousePointer,
} from 'lucide-react'
import { BANNER_HERO_STYLES, type BannerStyleId } from '@/lib/banner-hero'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductSrc      = 'upload' | 'shopify' | 'url'
type EmailTemplateId = 'indirim' | 'yeniurun' | 'sepetterk' | 'premium' | 'blackfriday' | 'minimal'
type PreviewMode     = 'desktop' | 'mobile'
type SendStep        = 'idle' | 'test' | 'campaign' | 'sending' | 'done'
type EditorZone      = 'hero' | 'title' | 'desc' | 'cta' | null

interface EmailFields {
  title: string; description: string; discount: string
  price: string; originalPrice: string; coupon: string
  cta: string; ctaUrl: string; footer: string
  unsubscribeUrl: string; brandName: string; brandColor: string
  subject: string; previewText: string; campaignName: string
}

interface GeneratedBanners { desktop: string | null; mobile: string | null }

interface DBProduct {
  id: string; productName: string; productImage: string | null; price: number | null
}

interface Segment {
  id: string; name: string; icon: string; color: string; count: number
}

interface EmailTemplateConfig {
  id: EmailTemplateId; name: string; icon: React.ElementType
  previewImage: string; defaults: Partial<EmailFields>; accentColor: string; dark?: boolean
}

interface ZoneRect {
  name: EditorZone; label: string; icon: React.ElementType; top: number; height: number
}

// ─── Email Templates ──────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: EmailTemplateConfig[] = [
  { id: 'indirim',     name: 'İndirim Maili',      icon: Tag,         previewImage: '/templates/email-indirim.jpeg',     accentColor: '#e84545', defaults: { title: 'BÜYÜK YAZ İNDİRİMİ!', description: 'Seçili ürünlerde sınırlı süre geçerli.', discount: '%50', price: '₺299', originalPrice: '₺599', coupon: 'INDIRIM50', cta: 'Hemen Alışveriş Yap' } },
  { id: 'yeniurun',    name: 'Yeni Ürün',           icon: Sparkles,    previewImage: '/templates/email-yeniurun.jpeg',    accentColor: '#4470ff', defaults: { title: 'YENİ KOLEKSİYON', description: 'Sezonun en yeni parçaları mağazamızda.', discount: '', price: '₺449', coupon: '', cta: 'Koleksiyonu Keşfet' } },
  { id: 'sepetterk',   name: 'Sepet Terk',          icon: ShoppingCart, previewImage: '/templates/email-sepetterk.jpeg', accentColor: '#f0a020', defaults: { title: 'Sepetinizde ürün var!', description: 'Seçtiğiniz ürünler sizi bekliyor.', discount: '%10', price: '₺349', originalPrice: '₺389', coupon: 'GERI10', cta: 'Alışverişi Tamamla' } },
  { id: 'premium',     name: 'Premium Lansman',     icon: Star,        previewImage: '/templates/email-premium.jpeg',    accentColor: '#c9a227', dark: true, defaults: { title: 'EXCLUSIVE COLLECTION', description: 'Sınırlı sayıda, özel tasarım koleksiyon.', price: '₺2.490', coupon: 'VIP2025', cta: 'Exclusive Koleksiyona Ulaş' } },
  { id: 'blackfriday', name: 'Black Friday',        icon: Zap,         previewImage: '/templates/email-blackfriday.jpeg', accentColor: '#ffffff', dark: true, defaults: { title: 'BLACK FRIDAY', description: 'Yılın en büyük indirimi. Sınırlı stok!', discount: '%70', price: '₺199', originalPrice: '₺669', coupon: 'BF2025', cta: 'Fırsatı Yakala' } },
  { id: 'minimal',     name: 'Minimal E-Ticaret',   icon: Package,     previewImage: '/templates/email-minimal.jpeg',    accentColor: '#111827', defaults: { title: 'Sizin için seçtik', description: 'Kaliteyi hissettiren ürünler.', price: '₺850', coupon: '', cta: 'İncele' } },
]

const DEFAULT_FIELDS: EmailFields = {
  title: 'Başlık', description: 'Açıklama.', discount: '%50',
  price: '₺299', originalPrice: '₺599', coupon: 'KUPON20',
  cta: 'Alışverişe Başla', ctaUrl: '#',
  footer: '© 2025 Marksio. Tüm hakları saklıdır.',
  unsubscribeUrl: '#', brandName: 'Marksio', brandColor: '#4470ff',
  subject: '', previewText: '', campaignName: '',
}

// ─── HTML Email Generators ────────────────────────────────────────────────────

function emailWrapper(inner: string, bg = '#f0f2f5') {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Email</title><style>body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}@media(max-width:480px){.em-pad{padding-left:20px!important;padding-right:20px!important}.em-title{font-size:26px!important;line-height:1.2!important}.em-hero img{height:220px!important;object-fit:cover!important}.em-price{font-size:28px!important}.em-cta{padding:15px 20px!important;font-size:14px!important}.em-2col-img{display:none!important}.em-2col-full{display:block!important;width:100%!important}}</style></head><body style="margin:0;padding:0;background-color:${bg};font-family:'Inter','Helvetica Neue',Arial,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bg};padding:24px 0;"><tr><td align="center" style="padding:0 12px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;background-color:#ffffff;box-shadow:0 4px 24px rgba(0,0,0,0.08);">${inner}</table></td></tr></table></body></html>`
}

function footerHtml(brandName: string, footer: string, unsub: string, a: string, bg = '#f8f9fa') {
  return `<tr><td bgcolor="${bg}" style="padding:14px 40px 18px;text-align:center;background-color:${bg};"><p style="margin:0 0 4px;font-size:11px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;">${footer || `© 2025 ${brandName}`}</p><p style="margin:0;font-size:11px;color:#9ca3af;font-family:'Inter',Arial,sans-serif;"><a href="${unsub||'#'}" style="color:${a};text-decoration:none;">Aboneliği iptal et</a></p></td></tr>`
}

function ctaHtml(label: string, url: string, a: string, textColor = '#ffffff') {
  return `<tr><td class="em-pad" style="padding:8px 40px 36px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td bgcolor="${a}" style="border-radius:8px;background-color:${a};text-align:center;"><a class="em-cta" href="${url||'#'}" style="display:block;padding:18px 32px;font-size:16px;font-weight:800;color:${textColor};text-decoration:none;letter-spacing:0.01em;font-family:'Inter',Arial,sans-serif;">${label} →</a></td></tr></table></td></tr>`
}

function heroHtml(src: string | null, fallback: string, alt: string) {
  return `<tr class="em-hero"><td style="padding:0;line-height:0;font-size:0;"><img src="${src||fallback}" width="600" alt="${alt}" style="display:block;width:100%;max-width:600px;height:340px;object-fit:cover;border:0;"></td></tr>`
}

function generateEmail(tplId: EmailTemplateId, f: EmailFields, hero: string | null): string {
  const a = f.brandColor || '#4470ff'

  if (tplId === 'indirim') {
    return emailWrapper(
      `<tr><td bgcolor="${a}" height="5" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td></tr>` +
      `<tr><td style="padding:0;line-height:0;font-size:0;position:relative;"><img src="${hero||'/templates/email-indirim.jpeg'}" width="600" alt="${f.title}" style="display:block;width:100%;height:340px;object-fit:cover;border:0;">${f.discount?`<div style="position:absolute;top:18px;right:18px;background:${a};color:#fff;font-size:22px;font-weight:900;padding:12px 16px;border-radius:12px;font-family:'Inter',Arial,sans-serif;line-height:1;text-align:center;min-width:64px;box-shadow:0 4px 16px rgba(0,0,0,0.25);">${f.discount}<br><span style="font-size:8px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">İNDİRİM</span></div>`:''}</td></tr>` +
      `<tr><td class="em-pad" style="padding:32px 40px 0;"><p style="margin:0 0 8px;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">${f.brandName}</p><h1 class="em-title" style="margin:0 0 12px;font-size:36px;font-weight:900;color:#111827;letter-spacing:-0.03em;line-height:1.1;font-family:'Inter',Arial,sans-serif;">${f.title}</h1><p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:${f.coupon?'20':'24'}px;"><tr>${f.originalPrice?`<td style="font-size:17px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:12px;vertical-align:middle;">${f.originalPrice}</td>`:''}<td class="em-price" style="font-size:42px;font-weight:900;color:${a};letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;line-height:1;">${f.price}</td></tr></table>${f.coupon?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="padding:14px 20px;border:2px dashed ${a};border-radius:10px;text-align:center;background:${a}0d;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">Kupon Kodu</p><p style="margin:0;font-size:22px;font-weight:900;letter-spacing:6px;color:${a};font-family:'Courier New',monospace;">${f.coupon}</p></td></tr></table>`:''}</td></tr>` +
      ctaHtml(f.cta, f.ctaUrl, a) +
      footerHtml(f.brandName, f.footer, f.unsubscribeUrl, a)
    )
  }

  if (tplId === 'yeniurun') {
    return emailWrapper(
      `<tr><td bgcolor="${a}" style="padding:20px 40px;background-color:${a};"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:20px;padding:5px 14px;background:rgba(255,255,255,0.22);"><span style="font-size:10px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#fff;font-family:'Inter',Arial,sans-serif;">✨ YENİ ÜRÜN</span></td></tr></table><p style="margin:8px 0 0;font-size:20px;font-weight:800;color:#fff;font-family:'Inter',Arial,sans-serif;">${f.brandName}</p></td></tr>` +
      heroHtml(hero, '/templates/email-yeniurun.jpeg', f.title) +
      `<tr><td class="em-pad" style="padding:32px 40px 0;"><h1 class="em-title" style="margin:0 0 12px;font-size:36px;font-weight:900;color:#111827;letter-spacing:-0.03em;line-height:1.1;font-family:'Inter',Arial,sans-serif;">${f.title}</h1><p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p><p class="em-price" style="margin:0 0 4px;font-size:38px;font-weight:900;color:${a};letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;line-height:1;">${f.price}</p></td></tr>` +
      ctaHtml(f.cta, f.ctaUrl, a) +
      footerHtml(f.brandName, f.footer, f.unsubscribeUrl, a)
    )
  }

  if (tplId === 'sepetterk') {
    return emailWrapper(
      `<tr><td bgcolor="${a}" height="5" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td></tr>` +
      `<tr><td class="em-pad" style="padding:26px 40px 16px;"><p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:1px;color:${a};font-family:'Inter',Arial,sans-serif;">🛒 Sepetiniz Sizi Bekliyor</p><h1 class="em-title" style="margin:0;font-size:30px;font-weight:900;color:#111827;letter-spacing:-0.025em;line-height:1.15;font-family:'Inter',Arial,sans-serif;">${f.title}</h1></td></tr>` +
      `<tr><td class="em-pad" style="padding:0 40px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:14px;overflow:hidden;border:1px solid #f0f0f0;"><tr><td width="140" style="padding:16px;vertical-align:middle;"><img src="${hero||'/templates/email-sepetterk.jpeg'}" width="108" alt="${f.title}" style="display:block;width:108px;height:108px;object-fit:cover;border:0;border-radius:10px;"></td><td style="padding:16px 16px 16px 0;vertical-align:middle;"><p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;font-family:'Inter',Arial,sans-serif;">${f.title}</p><p style="margin:0 0 10px;font-size:13px;color:#6b7280;line-height:1.5;font-family:'Inter',Arial,sans-serif;">${f.description}</p><table role="presentation" cellpadding="0" cellspacing="0"><tr>${f.originalPrice?`<td style="font-size:14px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:10px;vertical-align:middle;">${f.originalPrice}</td>`:''}<td class="em-price" style="font-size:26px;font-weight:900;color:${a};font-family:'Inter',Arial,sans-serif;line-height:1;">${f.price}</td></tr></table></td></tr></table></td></tr>` +
      `<tr><td class="em-pad" style="padding:0 40px 16px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;font-family:'Inter',Arial,sans-serif;">⏰ Stok tükenmeden tamamlayın!</p></td></tr>` +
      (f.coupon ? `<tr><td class="em-pad" style="padding:0 40px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:13px 20px;border:2px dashed ${a};border-radius:10px;text-align:center;background:${a}0d;"><p style="margin:0 0 3px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">Ekstra İndirim</p><p style="margin:0;font-size:20px;font-weight:900;letter-spacing:5px;color:${a};font-family:'Courier New',monospace;">${f.coupon}</p></td></tr></table></td></tr>` : '') +
      ctaHtml(f.cta, f.ctaUrl, a) +
      footerHtml(f.brandName, f.footer, f.unsubscribeUrl, a)
    )
  }

  if (tplId === 'premium') {
    return emailWrapper(
      `<tr><td style="padding:0;line-height:0;font-size:0;"><img src="${hero||'/templates/email-premium.jpeg'}" width="600" alt="${f.title}" style="display:block;width:100%;height:340px;object-fit:cover;border:0;"></td></tr>` +
      `<tr><td class="em-pad" style="padding:34px 40px 8px;background-color:#0d0d14;"><table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="border-radius:20px;padding:5px 16px;background:${a}22;border:1px solid ${a}44;"><span style="font-size:9px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">EXCLUSIVE LAUNCH</span></td></tr></table><h1 class="em-title" style="margin:0 0 14px;font-size:36px;font-weight:900;color:#f5f0e8;letter-spacing:-0.03em;line-height:1.1;font-family:'Inter',Arial,sans-serif;">${f.title}</h1><p style="margin:0 0 20px;font-size:15px;color:#8b8b9e;line-height:1.65;font-family:'Inter',Arial,sans-serif;">${f.description}</p>${f.coupon?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="padding:12px 18px;border:1px solid ${a}44;border-radius:10px;background:${a}11;"><span style="font-size:10px;color:#8b8b9e;font-family:'Inter',Arial,sans-serif;">VIP Kodu: </span><span style="font-size:14px;font-weight:800;letter-spacing:4px;color:${a};font-family:'Courier New',monospace;">${f.coupon}</span></td></tr></table>`:''}<p class="em-price" style="margin:0 0 28px;font-size:42px;font-weight:900;color:${a};letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;line-height:1;">${f.price}</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:34px;"><tr><td style="border-radius:8px;background-color:${a};text-align:center;"><a class="em-cta" href="${f.ctaUrl||'#'}" style="display:block;padding:18px 32px;font-size:16px;font-weight:800;color:#0d0d14;text-decoration:none;font-family:'Inter',Arial,sans-serif;">${f.cta} →</a></td></tr></table></td></tr>` +
      `<tr><td style="padding:14px 40px 18px;text-align:center;background-color:#08080f;"><p style="margin:0 0 3px;font-size:11px;color:#3e3e54;font-family:'Inter',Arial,sans-serif;">${f.footer||`© 2025 ${f.brandName}`}</p><p style="margin:0;font-size:11px;color:#3e3e54;font-family:'Inter',Arial,sans-serif;"><a href="${f.unsubscribeUrl||'#'}" style="color:${a};text-decoration:none;">Aboneliği iptal et</a></p></td></tr>`,
      '#0a0a10'
    )
  }

  if (tplId === 'blackfriday') {
    return emailWrapper(
      `<tr><td class="em-pad" style="padding:34px 40px 0;background-color:#000;text-align:center;"><p style="margin:0 0 3px;font-size:9px;font-weight:800;letter-spacing:5px;color:#444;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">— ${f.brandName} —</p><h1 class="em-title" style="margin:8px 0;font-size:48px;font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">${f.title}</h1>${f.discount?`<p style="margin:4px 0 2px;font-size:80px;font-weight:900;color:#fff;letter-spacing:-0.05em;line-height:1;font-family:'Inter',Arial,sans-serif;">${f.discount}</p><p style="margin:0;font-size:11px;font-weight:800;letter-spacing:4px;color:#555;font-family:'Inter',Arial,sans-serif;text-transform:uppercase;">İNDİRİM</p>`:''}</td></tr>` +
      `<tr><td style="padding:20px 0 0;background-color:#000;line-height:0;font-size:0;"><img src="${hero||'/templates/email-blackfriday.jpeg'}" width="600" alt="${f.title}" style="display:block;width:100%;height:300px;object-fit:cover;border:0;opacity:0.88;"></td></tr>` +
      `<tr><td class="em-pad" style="padding:26px 40px 20px;background-color:#000;"><p style="margin:0 0 14px;font-size:14px;color:#9ca3af;line-height:1.6;font-family:'Inter',Arial,sans-serif;">${f.description}</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;"><tr>${f.originalPrice?`<td style="font-size:16px;color:#555;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:12px;vertical-align:middle;">${f.originalPrice}</td>`:''}<td class="em-price" style="font-size:42px;font-weight:900;color:#fff;letter-spacing:-0.04em;font-family:'Inter',Arial,sans-serif;line-height:1;">${f.price}</td></tr></table>${f.coupon?`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="padding:12px 18px;border:2px dashed rgba(255,255,255,0.2);border-radius:10px;background:rgba(255,255,255,0.05);text-align:center;"><span style="font-size:9px;color:#555;font-family:'Inter',Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;">Kampanya Kodu: </span><span style="font-size:20px;font-weight:900;letter-spacing:5px;color:#fff;font-family:'Courier New',monospace;">${f.coupon}</span></td></tr></table>`:''}</td></tr>` +
      ctaHtml(f.cta, f.ctaUrl, '#ffffff', '#000000') +
      `<tr><td style="padding:14px 40px 16px;text-align:center;background-color:#0a0a0a;border-top:1px solid #1a1a1a;"><p style="margin:0 0 3px;font-size:11px;color:#444;font-family:'Inter',Arial,sans-serif;">${f.footer||`© 2025 ${f.brandName}`}</p><p style="margin:0;font-size:11px;color:#444;font-family:'Inter',Arial,sans-serif;"><a href="${f.unsubscribeUrl||'#'}" style="color:#888;text-decoration:none;">Aboneliği iptal et</a></p></td></tr>`,
      '#0a0a0a'
    )
  }

  // minimal
  return emailWrapper(
    `<tr><td class="em-pad" style="padding:28px 40px 20px;border-bottom:2px solid ${a}18;"><p style="margin:0;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:${a};font-family:'Inter',Arial,sans-serif;">${f.brandName}</p></td></tr>` +
    heroHtml(hero, '/templates/email-minimal.jpeg', f.title) +
    `<tr><td class="em-pad" style="padding:32px 40px 0;border-top:1px solid #f3f4f6;"><h1 class="em-title" style="margin:0 0 14px;font-size:32px;font-weight:800;color:#111827;letter-spacing:-0.03em;line-height:1.1;font-family:'Inter',Arial,sans-serif;">${f.title}</h1><p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.65;font-family:'Inter',Arial,sans-serif;">${f.description}</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr>${f.originalPrice?`<td style="font-size:16px;color:#9ca3af;text-decoration:line-through;font-family:'Inter',Arial,sans-serif;padding-right:12px;vertical-align:middle;">${f.originalPrice}</td>`:''}<td class="em-price" style="font-size:36px;font-weight:800;color:#111827;letter-spacing:-0.03em;font-family:'Inter',Arial,sans-serif;line-height:1;">${f.price}</td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;"><tr><td style="border-radius:8px;border:2.5px solid ${a};text-align:center;"><a class="em-cta" href="${f.ctaUrl||'#'}" style="display:block;padding:17px 32px;font-size:15px;font-weight:700;color:${a};text-decoration:none;font-family:'Inter',Arial,sans-serif;">${f.cta}</a></td></tr></table></td></tr>` +
    footerHtml(f.brandName, f.footer, f.unsubscribeUrl, a)
  )
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function FL({ c }: { c: string }) {
  return <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>{c}</label>
}

function FI({ v, o, ph, type = 'text', multi }: { v: string; o: (x: string) => void; ph?: string; type?: string; multi?: boolean }) {
  const s: React.CSSProperties = { width: '100%', padding: '9px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 10, fontSize: 12, color: '#111827', outline: 'none', resize: multi ? 'vertical' : 'none', fontFamily: 'inherit' }
  if (multi) return <textarea value={v} onChange={e => o(e.target.value)} placeholder={ph} rows={2} style={s} onFocus={e => (e.currentTarget.style.borderColor = '#4470ff')} onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
  return <input type={type} value={v} onChange={e => o(e.target.value)} placeholder={ph} style={s} onFocus={e => (e.currentTarget.style.borderColor = '#4470ff')} onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
}

const BRAND_COLORS = ['#4470ff', '#e84545', '#22c97a', '#f0a020', '#9f7afa', '#c9a227', '#0ea5e9', '#111827']

const DEFAULT_SEGMENTS: Segment[] = [
  { id: 'vip',       name: 'VIP Customers',      icon: '👑', color: '#c9a227', count: 0 },
  { id: 'high',      name: 'High Spenders',       icon: '💎', color: '#9f7afa', count: 0 },
  { id: 'new',       name: 'New Customers',       icon: '🌱', color: '#22c97a', count: 0 },
  { id: 'at-risk',   name: 'At Risk',             icon: '⚠️', color: '#f0a020', count: 0 },
  { id: 'inactive',  name: 'Inactive Customers',  icon: '💤', color: '#6b7280', count: 0 },
  { id: 'cart',      name: 'Cart Abandoners',     icon: '🛒', color: '#e84545', count: 0 },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIStudioPage() {
  // ── Product source
  const [productSrc,    setProductSrc]    = useState<ProductSrc>('upload')
  const [productImage,  setProductImage]  = useState<string | null>(null)
  const [productName,   setProductName]   = useState('')
  const [productUrl,    setProductUrl]    = useState('')
  const [urlError,      setUrlError]      = useState('')
  const [dbProducts,    setDbProducts]    = useState<DBProduct[]>([])
  const [dbLoading,     setDbLoading]     = useState(false)
  const [dbSearch,      setDbSearch]      = useState('')
  const [selectedDb,    setSelectedDb]    = useState<DBProduct | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Banner generation
  const [bannerStyle,      setBannerStyle]      = useState<BannerStyleId>('premium-studio')
  const [generatingBanner, setGeneratingBanner] = useState(false)
  const [banners,          setBanners]          = useState<GeneratedBanners | null>(null)
  const [bannerError,      setBannerError]      = useState('')

  // ── Email editing
  const [tplId,        setTplId]        = useState<EmailTemplateId>('indirim')
  const [fields,       setFields]       = useState<EmailFields>({ ...DEFAULT_FIELDS })
  const [previewMode,  setPreviewMode]  = useState<PreviewMode>('desktop')

  // ── Campaign / send
  const [segments,     setSegments]     = useState<Segment[]>(DEFAULT_SEGMENTS)
  const [segLoading,   setSegLoading]   = useState(false)
  const [selectedSeg,  setSelectedSeg]  = useState<string>('')
  const [sendStep,     setSendStep]     = useState<SendStep>('idle')
  const [testEmail,    setTestEmail]    = useState('')
  const [sendMsg,      setSendMsg]      = useState('')
  const [copied,       setCopied]       = useState(false)

  // ── Inline editor
  const [editMode,    setEditMode]    = useState(false)
  const [activeZone,  setActiveZone]  = useState<EditorZone>(null)
  const [zoneRects,   setZoneRects]   = useState<ZoneRect[]>([])
  const desktopIframeRef = useRef<HTMLIFrameElement>(null)

  const tplCfg   = EMAIL_TEMPLATES.find(t => t.id === tplId)!
  const styleDef = BANNER_HERO_STYLES.find(s => s.id === bannerStyle)!
  const heroImage = previewMode === 'mobile' ? (banners?.mobile ?? banners?.desktop ?? productImage) : (banners?.desktop ?? banners?.mobile ?? productImage)
  const emailHtml = generateEmail(tplId, { ...fields, brandColor: fields.brandColor || tplCfg.accentColor }, heroImage)

  const setF = useCallback(<K extends keyof EmailFields>(k: K) => (v: EmailFields[K]) =>
    setFields(p => ({ ...p, [k]: v })), [])

  // ── Load Shopify products
  const loadProducts = useCallback(async () => {
    if (dbProducts.length) return
    setDbLoading(true)
    try {
      const r = await fetch('/api/products')
      if (r.ok) setDbProducts(await r.json())
    } catch { /* silent */ } finally { setDbLoading(false) }
  }, [dbProducts.length])

  // ── Load segments
  useEffect(() => {
    setSegLoading(true)
    fetch('/api/segments')
      .then(r => r.ok ? r.json() : null)
      .then((data: Segment[] | null) => { if (data?.length) setSegments(data) })
      .catch(() => {})
      .finally(() => setSegLoading(false))
  }, [])

  // ── Measure clickable zone positions from iframe DOM
  function measureZones() {
    const iframe = desktopIframeRef.current
    if (!iframe?.contentDocument) return
    const doc = iframe.contentDocument
    const totalH = doc.documentElement.scrollHeight || 600

    function offsetTopOf(el: Element): number {
      let top = 0
      let cur: Element | null = el
      while (cur && cur !== doc.documentElement) {
        top += (cur as HTMLElement).offsetTop ?? 0
        cur = (cur as HTMLElement).offsetParent
      }
      return top
    }

    const queries: [EditorZone, string, string, React.ElementType][] = [
      ['hero',  'img[width="600"]',                                  'Görsel', Sparkles],
      ['title', 'h1',                                                'Başlık', Type],
      ['desc',  'td p[style*="font-size:14"], td p[style*="13px"]', 'Metin',  Pencil],
      ['cta',   'td[bgcolor] a, a[style*="display:block"]',         'CTA',    MousePointer],
    ]

    const rects: ZoneRect[] = []
    for (const [name, sel, label, Icon] of queries) {
      const el = doc.querySelector(sel)
      if (!el) continue
      const top = offsetTopOf(el)
      const h   = Math.max(44, (el as HTMLElement).offsetHeight)
      rects.push({ name, label, icon: Icon, top: top / totalH * 100, height: Math.max(8, h / totalH * 100) })
    }
    setZoneRects(rects)
  }

  // ── Product source switch
  function switchSrc(src: ProductSrc) {
    setProductSrc(src); setProductImage(null); setSelectedDb(null); setProductUrl(''); setUrlError('')
    setBanners(null); setEditMode(false); setActiveZone(null)
    if (src === 'shopify') loadProducts()
  }

  // ── File upload
  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = e => { setProductImage(e.target?.result as string); setBanners(null); setEditMode(false) }
    reader.readAsDataURL(file)
  }

  // ── URL load
  function loadUrl(url: string) {
    setUrlError(''); setProductImage(null)
    if (!url.trim()) return
    const img = new Image()
    img.onload  = () => { setProductImage(url); setBanners(null) }
    img.onerror = () => setUrlError('Görsel yüklenemedi — URL doğru mu?')
    img.src = url
  }

  // ── Template switch
  function selectTemplate(id: EmailTemplateId) {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === id)!
    setTplId(id)
    setFields(p => ({ ...p, ...tpl.defaults, brandColor: tpl.accentColor }))
    setEditMode(false); setActiveZone(null)
  }

  // ── Main generate: Grok copy + Fal banner in one call
  async function generateAll() {
    if (!activeProductImage) return
    setGeneratingBanner(true); setBannerError(''); setBanners(null); setEditMode(false); setActiveZone(null)
    try {
      const r = await fetch('/api/ai/studio-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageUrl: activeProductImage,
          bannerStyle,
          productName,
          templateId: tplId,
          brandName: fields.brandName,
        }),
      })
      const d = await r.json().catch(() => ({ error: 'Sunucu yanıtı okunamadı.' }))
      if (!r.ok) {
        // Vercel can return { error: { code, message } } — extract string safely
        const errMsg = typeof d?.error === 'string'
          ? d.error
          : (d?.error?.message ?? d?.message ?? JSON.stringify(d))
        throw new Error(errMsg)
      }

      setBanners({ desktop: d.desktop ?? null, mobile: d.mobile ?? null })
      setPreviewMode('desktop')
      setFields(p => ({
        ...p,
        title:       typeof d.headline    === 'string' ? d.headline    : p.title,
        description: typeof d.description === 'string' ? d.description : p.description,
        cta:         typeof d.cta         === 'string' ? d.cta         : p.cta,
        subject:     typeof d.subject     === 'string' ? d.subject     : p.subject,
        previewText: typeof d.previewText === 'string' ? d.previewText : p.previewText,
        brandColor:  typeof d.brandColor  === 'string' ? d.brandColor  : p.brandColor,
      }))
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setBannerError(msg || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setGeneratingBanner(false)
    }
  }

  // ── HTML copy — always exports the live edited state
  function copyHTML() {
    navigator.clipboard.writeText(emailHtml).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // ── Test mail
  async function sendTestMail() {
    if (!testEmail.trim()) { setSendMsg('E-posta adresi gerekli.'); return }
    setSendStep('sending'); setSendMsg('')
    try {
      const r = await fetch('/api/ai/banner-test-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim(), bannerHtml: emailHtml, subject: fields.subject || fields.title, storeName: fields.brandName }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSendMsg('✅ Test mail gönderildi!'); setSendStep('done')
    } catch (e) { setSendMsg('❌ ' + (e as Error).message); setSendStep('test') }
  }

  // ── Campaign send
  async function sendCampaign(asDraft = false) {
    if (!asDraft && !selectedSeg) { setSendMsg('Segment seçiniz.'); return }
    setSendStep('sending'); setSendMsg('')
    try {
      const cr = await fetch('/api/campaigns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.campaignName || fields.title, type: 'email', status: 'draft',
          segment: selectedSeg || 'all', subject: fields.subject || fields.title,
          previewText: fields.previewText, headline: fields.title, body: fields.description,
          cta: fields.ctaUrl || '#', ctaText: fields.cta,
          imageUrl: banners?.desktop ?? null, brandColor: fields.brandColor || tplCfg.accentColor,
          purpose: tplId,
        }),
      })
      const campaign = await cr.json()
      if (!cr.ok) throw new Error(campaign.error)

      if (asDraft) { setSendMsg('✅ Taslak kaydedildi!'); setSendStep('done'); return }

      const sr = await fetch(`/api/campaigns/${campaign.id}/send`, { method: 'POST' })
      const sd = await sr.json()
      if (!sr.ok) throw new Error(sd.error)
      setSendMsg(`✅ ${sd.sent} kişiye gönderildi${sd.failed ? ` (${sd.failed} başarısız)` : ''}!`)
      setSendStep('done')
    } catch (e) { setSendMsg('❌ ' + (e as Error).message); setSendStep('campaign') }
  }

  const activeProductImage = productSrc === 'shopify' ? (selectedDb?.productImage ?? null) : productImage

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden" style={{ background: '#f2f2f7' }}>

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-5 shrink-0"
          style={{ height: 54, background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#4470ff,#9f7afa)' }}>
              <Mail className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-[13px] font-bold" style={{ color: '#111827' }}>AI Studio</p>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#f0f4ff', color: '#4470ff', border: '1px solid #c7d7ff' }}>
              {banners ? `${styleDef.icon} ${styleDef.name}` : 'Banner Builder'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 p-0.5 rounded-xl" style={{ background: '#f3f4f6' }}>
              {(['desktop', 'mobile'] as PreviewMode[]).map(m => {
                const Icon = m === 'desktop' ? Monitor : Smartphone
                return (
                  <button key={m} onClick={() => setPreviewMode(m)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{ background: previewMode === m ? '#fff' : 'transparent', color: previewMode === m ? '#4470ff' : '#9ca3af', boxShadow: previewMode === m ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                    <Icon className="w-3.5 h-3.5" />
                    {m === 'desktop' ? 'Desktop' : 'Mobil'}
                  </button>
                )
              })}
            </div>

            {banners && previewMode === 'desktop' && (
              <button onClick={() => { setEditMode(v => !v); setActiveZone(null) }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: editMode ? '#f0f4ff' : '#f9fafb', color: editMode ? '#4470ff' : '#374151', border: `1px solid ${editMode ? '#c7d7ff' : '#e5e7eb'}` }}>
                <Pencil className="w-3.5 h-3.5" />
                {editMode ? 'Düzenlemede' : 'Düzenle'}
              </button>
            )}

            <button onClick={copyHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all"
              style={{ background: copied ? '#f0fdf4' : '#f9fafb', color: copied ? '#16a34a' : '#374151', border: `1px solid ${copied ? '#bbf7d0' : '#e5e7eb'}` }}>
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Kopyalandı' : 'HTML'}
            </button>

            <button onClick={() => setSendStep('test')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold"
              style={{ background: '#f0f4ff', color: '#4470ff', border: '1px solid #c7d7ff' }}>
              <Eye className="w-3.5 h-3.5" /> Test Mail
            </button>

            <button onClick={() => setSendStep('campaign')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold"
              style={{ background: 'linear-gradient(135deg,#4470ff,#6c47ff)', color: '#fff', boxShadow: '0 4px 14px rgba(68,112,255,0.35)' }}>
              <Send className="w-3.5 h-3.5" /> Kampanya Gönder
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

          {/* ── Left panel ── */}
          <div className="w-full lg:w-[310px] shrink-0 flex flex-col overflow-y-auto lg:max-h-full"
            style={{ background: '#fff', borderRight: '1px solid rgba(0,0,0,0.07)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>

            {/* 1. Ürün Görseli */}
            <section className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Ürün Görseli</p>

              <div className="flex gap-1 p-0.5 rounded-xl mb-3" style={{ background: '#f3f4f6' }}>
                {([['upload', Upload, 'Yükle'], ['shopify', ShoppingBag, 'Shopify'], ['url', Link2, 'URL']] as [ProductSrc, React.ElementType, string][])
                  .map(([src, Icon, label]) => (
                    <button key={src} onClick={() => switchSrc(src)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                      style={{ background: productSrc === src ? '#fff' : 'transparent', color: productSrc === src ? '#4470ff' : '#9ca3af', boxShadow: productSrc === src ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  ))}
              </div>

              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {productSrc === 'upload' && (
                activeProductImage ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb' }}>
                    <img src={activeProductImage} alt="Ürün" className="w-full h-32 object-contain" style={{ background: '#f9fafb' }} />
                    <button onClick={() => { setProductImage(null); setBanners(null); setEditMode(false); if (fileRef.current) fileRef.current.value = '' }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full rounded-xl flex flex-col items-center justify-center gap-2 transition-all"
                    style={{ height: 90, border: '2px dashed #d1d5db', background: '#fafafa' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#4470ff'; e.currentTarget.style.background = '#f0f4ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafafa' }}>
                    <Upload className="w-5 h-5" style={{ color: '#4470ff' }} />
                    <p className="text-[11px] font-semibold" style={{ color: '#374151' }}>Görsel yükle veya sürükle</p>
                  </button>
                )
              )}

              {productSrc === 'shopify' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                    <input value={dbSearch} onChange={e => setDbSearch(e.target.value)} placeholder="Ürün ara..."
                      className="w-full text-[12px] outline-none rounded-xl"
                      style={{ paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827' }} />
                  </div>
                  {dbLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin" style={{ color: '#4470ff' }} /></div>
                  ) : dbProducts.length === 0 ? (
                    <p className="text-[11px] text-center py-4" style={{ color: '#9ca3af' }}>Shopify entegrasyonu gerekli</p>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      {dbProducts.filter(p => p.productName.toLowerCase().includes(dbSearch.toLowerCase())).map(p => (
                        <button key={p.id} onClick={() => { setSelectedDb(p); setProductName(p.productName); setBanners(null) }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all"
                          style={{ border: selectedDb?.id === p.id ? '1.5px solid #4470ff' : '1.5px solid #f3f4f6', background: selectedDb?.id === p.id ? '#f0f4ff' : '#fafafa' }}>
                          {p.productImage
                            ? <img src={p.productImage} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                            : <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f3f4f6' }}><Package className="w-4 h-4" style={{ color: '#9ca3af' }} /></div>}
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold truncate" style={{ color: '#111827' }}>{p.productName}</p>
                            {p.price && <p className="text-[10px]" style={{ color: '#4470ff' }}>₺{p.price.toFixed(2)}</p>}
                          </div>
                          {selectedDb?.id === p.id && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#4470ff' }} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {productSrc === 'url' && (
                <div className="space-y-2">
                  <FI v={productUrl} o={v => { setProductUrl(v); loadUrl(v) }} ph="https://cdn.ornek.com/urun.jpg" />
                  {urlError && <p className="text-[10px]" style={{ color: '#dc2626' }}>{urlError}</p>}
                  {productImage && !urlError && (
                    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb' }}>
                      <img src={productImage} className="w-full h-28 object-contain" style={{ background: '#f9fafb' }} />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-3">
                <FL c="Ürün Adı (kategori tespiti için)" />
                <FI v={productName} o={setProductName} ph="Nike Air Max, Chanel No.5..." />
              </div>
            </section>

            {/* 2. Banner Stili */}
            <section className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>
                Mail Banner Stili
              </p>
              <p className="text-[10px] mb-3" style={{ color: '#6b7280' }}>
                Seçilen görselin ışığı, arka planı ve kompozisyonu referans olarak kullanılır.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {BANNER_HERO_STYLES.map(s => {
                  const isActive = s.id === bannerStyle
                  return (
                    <button key={s.id} onClick={() => setBannerStyle(s.id)}
                      className="flex flex-col items-start p-2.5 rounded-xl text-left transition-all"
                      style={{
                        border: isActive ? `2px solid ${s.accentColor}` : '1.5px solid #f3f4f6',
                        background: isActive ? `${s.accentColor}0a` : '#fafafa',
                        boxShadow: isActive ? `0 0 0 3px ${s.accentColor}18` : 'none',
                        opacity: !activeProductImage ? 0.45 : 1,
                      }}>
                      <div className="w-full h-14 rounded-lg overflow-hidden mb-1.5 relative">
                        <img src={s.previewImage} alt={s.name} className="w-full h-full object-cover"
                          style={{ opacity: isActive ? 1 : 0.6 }} />
                        {isActive && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ background: s.accentColor }}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px]">{s.icon}</span>
                        <span className="text-[10px] font-semibold leading-tight"
                          style={{ color: isActive ? s.accentColor : '#374151' }}>
                          {s.name}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <button onClick={generateAll} disabled={!activeProductImage || generatingBanner}
                className="w-full py-2.5 rounded-2xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: !activeProductImage ? '#e5e7eb'
                    : generatingBanner ? 'linear-gradient(135deg,#a78bfa,#c084fc)'
                    : `linear-gradient(135deg,${styleDef.accentColor === '#ffffff' ? '#6b7280' : styleDef.accentColor},${styleDef.accentColor === '#ffffff' ? '#374151' : styleDef.accentColor}bb)`,
                  color: !activeProductImage ? '#9ca3af' : '#fff',
                  boxShadow: activeProductImage && !generatingBanner ? `0 5px 18px ${styleDef.accentColor === '#ffffff' ? '#6b728088' : styleDef.accentColor + '55'}` : 'none',
                  cursor: !activeProductImage ? 'not-allowed' : 'pointer',
                }}>
                {generatingBanner
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Hazırlanıyor...</>
                  : banners
                    ? <><RefreshCw className="w-4 h-4" /> Yeniden Oluştur</>
                    : <><Sparkles className="w-4 h-4" /> Banner Oluştur</>}
              </button>

              {!activeProductImage && (
                <p className="text-[10px] mt-2 text-center flex items-center justify-center gap-1" style={{ color: '#9ca3af' }}>
                  <AlertCircle className="w-3 h-3" /> Önce ürün görseli ekleyin
                </p>
              )}
              {bannerError && (
                <div className="mt-2 rounded-xl p-2.5 flex items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px]" style={{ color: '#dc2626' }}>{bannerError}</p>
                    <button onClick={generateAll} className="text-[11px] font-semibold mt-1" style={{ color: '#dc2626', textDecoration: 'underline' }}>
                      Tekrar dene
                    </button>
                  </div>
                </div>
              )}
              {banners && !bannerError && (
                <div className="mt-2.5 rounded-xl p-2 flex items-center gap-2"
                  style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Check className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />
                  <p className="text-[11px] font-semibold" style={{ color: '#166534' }}>
                    Banner hazır — {[banners.desktop && 'Desktop', banners.mobile && 'Mobil'].filter(Boolean).join(' · ')}
                  </p>
                </div>
              )}
            </section>

            {/* 3. Mail Şablonu */}
            <section className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Mail Şablonu</p>
              <div className="grid grid-cols-2 gap-2">
                {EMAIL_TEMPLATES.map(tpl => {
                  const Icon   = tpl.icon
                  const active = tpl.id === tplId
                  return (
                    <button key={tpl.id} onClick={() => selectTemplate(tpl.id)}
                      className="flex flex-col items-start p-2.5 rounded-xl text-left transition-all"
                      style={{ border: active ? `2px solid ${tpl.accentColor}` : '1.5px solid #f3f4f6', background: active ? `${tpl.accentColor}0a` : '#fafafa', boxShadow: active ? `0 0 0 3px ${tpl.accentColor}18` : 'none' }}>
                      <div className="w-full h-10 rounded-lg overflow-hidden mb-1.5 relative">
                        <img src={tpl.previewImage} alt={tpl.name} className="w-full h-full object-cover" style={{ opacity: active ? 1 : 0.6 }} />
                        {active && <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: tpl.accentColor }}><Check className="w-2.5 h-2.5 text-white" /></div>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon className="w-3 h-3 shrink-0" style={{ color: active ? tpl.accentColor : '#9ca3af' }} />
                        <span className="text-[10px] font-semibold leading-tight" style={{ color: active ? tpl.accentColor : '#374151' }}>{tpl.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* 4. İçerik Düzenle */}
            <section className="p-4 border-b space-y-3" style={{ borderColor: 'rgba(0,0,0,0.07)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>İçerik Düzenle</p>
              <div><FL c="Marka Adı" /><FI v={fields.brandName} o={setF('brandName')} ph="Marksio" /></div>
              <div><FL c="Başlık" /><FI v={fields.title} o={setF('title')} ph="Email başlığı" /></div>
              <div><FL c="Açıklama" /><FI v={fields.description} o={setF('description')} ph="Açıklama..." multi /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><FL c="Fiyat" /><FI v={fields.price} o={setF('price')} ph="₺299" /></div>
                <div><FL c="Orijinal" /><FI v={fields.originalPrice} o={setF('originalPrice')} ph="₺599" /></div>
              </div>
              <div><FL c="İndirim Oranı" /><FI v={fields.discount} o={setF('discount')} ph="%50" /></div>
              <div><FL c="Kupon Kodu" /><FI v={fields.coupon} o={setF('coupon')} ph="KUPON20" /></div>
              <div><FL c="CTA Metni" /><FI v={fields.cta} o={setF('cta')} ph="Alışverişe Başla" /></div>
              <div><FL c="CTA Linki" /><FI v={fields.ctaUrl} o={setF('ctaUrl')} ph="https://..." /></div>
              <div><FL c="Footer" /><FI v={fields.footer} o={setF('footer')} ph="© 2025 Marka." /></div>
              <div><FL c="Abonelik İptal Linki" /><FI v={fields.unsubscribeUrl} o={setF('unsubscribeUrl')} ph="https://..." /></div>
              <div>
                <FL c="Marka Rengi" />
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {BRAND_COLORS.map(c => (
                    <button key={c} onClick={() => setF('brandColor')(c)} className="rounded-full shrink-0 transition-all"
                      style={{ width: 20, height: 20, background: c, boxShadow: fields.brandColor === c ? `0 0 0 2px #fff,0 0 0 3.5px ${c}` : 'none' }} />
                  ))}
                  <input type="color" value={fields.brandColor} onChange={e => setF('brandColor')(e.target.value)}
                    className="w-5 h-5 rounded-full cursor-pointer border-0" style={{ padding: 1 }} title="Özel" />
                </div>
              </div>
            </section>

            {/* 5. Kampanya Bilgileri */}
            <section className="p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Kampanya Bilgileri</p>
              <div><FL c="Kampanya Adı" /><FI v={fields.campaignName} o={setF('campaignName')} ph="Yaz İndirimi 2025" /></div>
              <div><FL c="Mail Konusu" /><FI v={fields.subject} o={setF('subject')} ph="Bugün %50 indirim!" /></div>
              <div><FL c="Önizleme Metni" /><FI v={fields.previewText} o={setF('previewText')} ph="Sınırlı süre fırsatı..." /></div>
            </section>
          </div>

          {/* ── Right panel — preview ── */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#eef0f5' }}
            onClick={() => { if (editMode) { setActiveZone(null) } }}>

            {/* Editor toolbar — shown when edit mode is on and a zone is selected */}
            {editMode && (
              <div className="shrink-0 border-b px-4 py-2.5 flex items-center gap-3 flex-wrap"
                style={{ background: '#fff', borderColor: 'rgba(0,0,0,0.07)', minHeight: 52 }}
                onClick={e => e.stopPropagation()}>

                {!activeZone && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4470ff' }} />
                    <p className="text-[11px] font-semibold" style={{ color: '#6b7280' }}>
                      Düzenleme modu aktif — önizlemede bir öğeye tıklayın
                    </p>
                    {zoneRects.map(z => {
                      const Icon = z.icon
                      return (
                        <button key={z.name} onClick={() => setActiveZone(z.name)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
                          style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                          <Icon className="w-3 h-3" /> {z.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {activeZone === 'title' && (
                  <div className="flex items-center gap-2 flex-1">
                    <Type className="w-3.5 h-3.5 shrink-0" style={{ color: '#4470ff' }} />
                    <span className="text-[11px] font-bold shrink-0" style={{ color: '#374151' }}>Başlık</span>
                    <input value={fields.title} onChange={e => setF('title')(e.target.value)}
                      className="flex-1 min-w-0 text-[12px] font-semibold outline-none rounded-lg px-2.5 py-1.5"
                      style={{ background: '#f9fafb', border: '1.5px solid #4470ff', color: '#111827' }} />
                    <input type="color" value={fields.brandColor} onChange={e => setF('brandColor')(e.target.value)}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 shrink-0" title="Renk" />
                    <button onClick={() => setActiveZone(null)} className="shrink-0"><X className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} /></button>
                  </div>
                )}

                {activeZone === 'desc' && (
                  <div className="flex items-center gap-2 flex-1">
                    <Pencil className="w-3.5 h-3.5 shrink-0" style={{ color: '#4470ff' }} />
                    <span className="text-[11px] font-bold shrink-0" style={{ color: '#374151' }}>Açıklama</span>
                    <input value={fields.description} onChange={e => setF('description')(e.target.value)}
                      className="flex-1 min-w-0 text-[12px] outline-none rounded-lg px-2.5 py-1.5"
                      style={{ background: '#f9fafb', border: '1.5px solid #4470ff', color: '#111827' }} />
                    <button onClick={() => setActiveZone(null)} className="shrink-0"><X className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} /></button>
                  </div>
                )}

                {activeZone === 'cta' && (
                  <div className="flex items-center gap-2 flex-1">
                    <MousePointer className="w-3.5 h-3.5 shrink-0" style={{ color: '#4470ff' }} />
                    <span className="text-[11px] font-bold shrink-0" style={{ color: '#374151' }}>CTA</span>
                    <input value={fields.cta} onChange={e => setF('cta')(e.target.value)} placeholder="Buton metni"
                      className="w-44 text-[12px] font-semibold outline-none rounded-lg px-2.5 py-1.5"
                      style={{ background: '#f9fafb', border: '1.5px solid #4470ff', color: '#111827' }} />
                    <input value={fields.ctaUrl} onChange={e => setF('ctaUrl')(e.target.value)} placeholder="https://..."
                      className="flex-1 min-w-0 text-[12px] outline-none rounded-lg px-2.5 py-1.5"
                      style={{ background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827' }} />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px]" style={{ color: '#9ca3af' }}>Renk</span>
                      <input type="color" value={fields.brandColor} onChange={e => setF('brandColor')(e.target.value)}
                        className="w-7 h-7 rounded-lg cursor-pointer border-0" />
                    </div>
                    <button onClick={() => setActiveZone(null)} className="shrink-0"><X className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} /></button>
                  </div>
                )}

                {activeZone === 'hero' && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#4470ff' }} />
                    <span className="text-[11px] font-bold" style={{ color: '#374151' }}>Görsel</span>
                    <button onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>
                      <Upload className="w-3 h-3" /> Görsel Değiştir
                    </button>
                    <button onClick={generateAll}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{ background: '#f0f4ff', color: '#4470ff', border: '1px solid #c7d7ff' }}>
                      <RefreshCw className="w-3 h-3" /> Yeniden Oluştur
                    </button>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px]" style={{ color: '#9ca3af' }}>Stil:</span>
                      {BANNER_HERO_STYLES.map(s => (
                        <button key={s.id} onClick={() => setBannerStyle(s.id)}
                          className="text-[10px] px-2 py-1 rounded-lg font-semibold transition-all"
                          style={{ background: bannerStyle === s.id ? `${s.accentColor}15` : '#f3f4f6', color: bannerStyle === s.id ? s.accentColor : '#6b7280', border: bannerStyle === s.id ? `1px solid ${s.accentColor}44` : '1px solid transparent' }}>
                          {s.icon} {s.name}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setActiveZone(null)} className="ml-auto shrink-0"><X className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} /></button>
                  </div>
                )}
              </div>
            )}

            {/* Preview area */}
            <div className="flex-1 flex items-start justify-center overflow-auto p-6 relative">

              {/* Generating overlay */}
              {generatingBanner && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10"
                  style={{ background: 'rgba(238,240,245,0.94)', backdropFilter: 'blur(6px)' }}>
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#4470ff,#9f7afa)', boxShadow: '0 12px 40px rgba(68,112,255,0.4)' }}>
                      <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                      <Loader2 className="w-3 h-3 animate-spin" style={{ color: '#4470ff' }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[16px] font-bold" style={{ color: '#111827' }}>Kampanyanız hazırlanıyor...</p>
                    <p className="text-[12px] mt-1.5" style={{ color: '#6b7280' }}>
                      İçerik ve görsel aynı anda oluşturuluyor
                    </p>
                  </div>
                </div>
              )}

              {previewMode === 'desktop' ? (
                <div className="w-full" style={{ maxWidth: 660 }}>
                  <div className="flex items-center justify-between mb-2.5 px-1">
                    <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                      Desktop — 600px
                      {banners?.desktop && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>AI Banner ✓</span>}
                    </span>
                    <span className="text-[11px]" style={{ color: '#9ca3af' }}>{tplCfg.name}</span>
                  </div>
                  <div className="rounded-t-xl overflow-hidden" style={{ background: '#e5e7eb', padding: '8px 10px 0' }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}
                      <div className="flex-1 mx-3 h-4 rounded-full" style={{ background: '#fff', border: '1px solid #d1d5db' }} />
                    </div>
                  </div>
                  {/* Iframe + editor overlay wrapper */}
                  <div style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', position: 'relative' }}>
                    <iframe
                      ref={desktopIframeRef}
                      srcDoc={emailHtml}
                      title="Email preview"
                      sandbox="allow-same-origin"
                      style={{ display: 'block', width: '100%', minHeight: 480, border: 'none' }}
                      onLoad={e => {
                        const d = e.currentTarget.contentDocument
                        if (d) e.currentTarget.style.height = d.documentElement.scrollHeight + 'px'
                        e.currentTarget.contentWindow?.scrollTo(0, 0)
                        measureZones()
                      }}
                    />

                    {/* Clickable zone overlay — only in edit mode */}
                    {editMode && (
                      <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
                        {zoneRects.map(zone => (
                          <div
                            key={zone.name}
                            className="absolute transition-all cursor-pointer"
                            style={{
                              top: `${zone.top}%`,
                              height: `${zone.height}%`,
                              left: 0, right: 0,
                              pointerEvents: 'all',
                              border: activeZone === zone.name
                                ? '2px solid #4470ff'
                                : '2px solid transparent',
                              background: activeZone === zone.name
                                ? 'rgba(68,112,255,0.06)'
                                : 'transparent',
                            }}
                            onMouseEnter={e => {
                              if (activeZone !== zone.name) {
                                e.currentTarget.style.borderColor = 'rgba(68,112,255,0.35)'
                                e.currentTarget.style.background  = 'rgba(68,112,255,0.03)'
                              }
                            }}
                            onMouseLeave={e => {
                              if (activeZone !== zone.name) {
                                e.currentTarget.style.borderColor = 'transparent'
                                e.currentTarget.style.background  = 'transparent'
                              }
                            }}
                            onClick={e => { e.stopPropagation(); setActiveZone(zone.name) }}
                          >
                            <div className="absolute top-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
                              style={{
                                background: activeZone === zone.name ? '#4470ff' : 'rgba(68,112,255,0.75)',
                                opacity: activeZone === zone.name ? 1 : 0,
                                transition: 'opacity 0.15s',
                              }}>
                              <zone.icon className="w-2.5 h-2.5 text-white" />
                              <span className="text-[9px] font-bold text-white">{zone.label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* "Edit mode" hint shown once when banners are ready but edit mode is off */}
                    {!editMode && banners && (
                      <div
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold opacity-0 hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(255,255,255,0.95)', color: '#4470ff', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', border: '1px solid #c7d7ff', pointerEvents: 'none' }}>
                        <Pencil className="w-3 h-3" /> Düzenlemek için üstteki Düzenle butonuna tıklayın
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="mb-2.5">
                    <span className="text-[11px] font-semibold" style={{ color: '#9ca3af' }}>
                      Mobile — 375px
                      {banners?.mobile && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>AI Banner ✓</span>}
                    </span>
                  </div>
                  <div style={{ width: 380, background: '#1c1c1e', borderRadius: 46, padding: '12px 9px', boxShadow: '0 30px 80px rgba(0,0,0,0.4),inset 0 0 0 2px rgba(255,255,255,0.12)' }}>
                    <div className="flex justify-center mb-2">
                      <div style={{ width: 90, height: 26, background: '#000', borderRadius: 20 }} />
                    </div>
                    <div style={{ borderRadius: 34, overflow: 'hidden', background: '#f4f4f4' }}>
                      <div style={{ background: '#fff', padding: '9px 12px', borderBottom: '1px solid #f0f0f0' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: fields.brandColor }}>
                            {(fields.brandName||'M')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold" style={{ color: '#111' }}>{fields.brandName||'Marka'}</p>
                            <p className="text-[9px]" style={{ color: '#9ca3af' }}>info@marka.com</p>
                          </div>
                        </div>
                      </div>
                      <div style={{ background: '#f4f4f4', padding: 7, maxHeight: 540, overflow: 'hidden' }}>
                        <iframe srcDoc={emailHtml} title="Mobile preview" sandbox="allow-same-origin"
                          style={{ display: 'block', width: '100%', height: 520, border: 'none', borderRadius: 6, background: '#fff' }} />
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <div style={{ width: 90, height: 3.5, background: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Test Mail Modal ── */}
      {(sendStep === 'test' || (sendStep === 'sending' && testEmail) || (sendStep === 'done' && testEmail && !selectedSeg)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="w-[480px] rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <p className="text-[14px] font-bold" style={{ color: '#111827' }}>Test Mail Gönder</p>
              <button onClick={() => { setSendStep('idle'); setSendMsg('') }}><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
            </div>
            <div className="mx-4 mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb', height: 200 }}>
              <iframe srcDoc={emailHtml} title="test-preview" sandbox="allow-same-origin"
                style={{ display: 'block', width: '100%', height: 200, border: 'none' }} />
            </div>
            <div className="p-5 space-y-4">
              {sendStep === 'done' && sendMsg.startsWith('✅') ? (
                <div className="text-center py-2">
                  <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2" style={{ background: '#f0fdf4' }}>
                    <Check className="w-5 h-5" style={{ color: '#16a34a' }} />
                  </div>
                  <p className="text-[13px] font-bold mb-3" style={{ color: '#111827' }}>{sendMsg}</p>
                  <button onClick={() => { setSendStep('idle'); setSendMsg('') }} className="px-5 py-2 rounded-xl text-[12px] font-semibold" style={{ background: '#f5f3ff', color: '#4470ff' }}>Kapat</button>
                </div>
              ) : (
                <>
                  <div><FL c="E-posta Adresi" /><FI v={testEmail} o={setTestEmail} ph="ornek@mail.com" type="email" /></div>
                  {sendMsg && <p className="text-[11px]" style={{ color: sendMsg.startsWith('❌') ? '#dc2626' : '#16a34a' }}>{sendMsg}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setSendStep('idle'); setSendMsg('') }} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>İptal</button>
                    <button onClick={sendTestMail} disabled={sendStep === 'sending'}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#4470ff,#6c47ff)', color: '#fff' }}>
                      {sendStep === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendStep === 'sending' ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Campaign Send Modal ── */}
      {(sendStep === 'campaign' || (sendStep === 'sending' && selectedSeg) || (sendStep === 'done' && selectedSeg)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
          <div className="w-[520px] rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <p className="text-[14px] font-bold" style={{ color: '#111827' }}>Kampanya Gönder</p>
                <p className="text-[11px]" style={{ color: '#9ca3af' }}>{fields.campaignName || fields.title}</p>
              </div>
              <button onClick={() => { setSendStep('idle'); setSendMsg(''); setSelectedSeg('') }}><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
            </div>
            <div className="p-5 space-y-5">
              {sendStep === 'done' ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: sendMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2' }}>
                    {sendMsg.startsWith('✅') ? <Check className="w-6 h-6" style={{ color: '#16a34a' }} /> : <AlertCircle className="w-6 h-6" style={{ color: '#dc2626' }} />}
                  </div>
                  <p className="text-[14px] font-bold mb-4" style={{ color: '#111827' }}>{sendMsg}</p>
                  <button onClick={() => { setSendStep('idle'); setSendMsg(''); setSelectedSeg('') }} className="px-6 py-2.5 rounded-xl text-[13px] font-semibold" style={{ background: '#f5f3ff', color: '#4470ff' }}>Kapat</button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-bold mb-2.5" style={{ color: '#374151' }}>
                      <Users className="w-3.5 h-3.5 inline mr-1" />
                      Hedef Segment
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(segLoading ? DEFAULT_SEGMENTS : segments).map(seg => (
                        <button key={seg.id} onClick={() => setSelectedSeg(seg.id)}
                          className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                          style={{ border: selectedSeg === seg.id ? `2px solid ${seg.color}` : '1.5px solid #f3f4f6', background: selectedSeg === seg.id ? `${seg.color}0a` : '#fafafa' }}>
                          <span className="text-base shrink-0">{seg.icon}</span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold truncate" style={{ color: '#111827' }}>{seg.name}</p>
                            <p className="text-[10px]" style={{ color: seg.color }}>{seg.count} kişi</p>
                          </div>
                          {selectedSeg === seg.id && <Check className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: seg.color }} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl p-3.5 space-y-2" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                    <p className="text-[11px] font-bold" style={{ color: '#374151' }}>Kampanya Özeti</p>
                    {[
                      ['Konu',   fields.subject || fields.title],
                      ['Başlık', fields.title],
                      ['Banner', banners?.desktop ? '✅ AI Banner hazır' : '⚠️ Banner yok (ürün görseli kullanılacak)'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2">
                        <span className="text-[10px] font-semibold shrink-0 w-16" style={{ color: '#9ca3af' }}>{k}</span>
                        <span className="text-[11px] truncate" style={{ color: '#374151' }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  {sendMsg && <p className="text-[11px]" style={{ color: sendMsg.startsWith('❌') ? '#dc2626' : '#16a34a' }}>{sendMsg}</p>}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => sendCampaign(true)} disabled={sendStep === 'sending'}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5"
                      style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>
                      {sendStep === 'sending' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Taslak Kaydet
                    </button>
                    <button onClick={() => sendCampaign(false)} disabled={sendStep === 'sending' || !selectedSeg}
                      className="flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2"
                      style={{ background: !selectedSeg ? '#e5e7eb' : 'linear-gradient(135deg,#4470ff,#6c47ff)', color: !selectedSeg ? '#9ca3af' : '#fff', boxShadow: selectedSeg ? '0 4px 16px rgba(68,112,255,0.35)' : 'none' }}>
                      {sendStep === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sendStep === 'sending' ? 'Gönderiliyor...' : 'Kampanyayı Gönder'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
