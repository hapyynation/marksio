'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { useRouter } from 'next/navigation'
import {
  Sparkles, Loader2, Check, Bell, ChevronDown, AlertCircle, Zap,
  Upload, ShoppingBag, Link2, Store, CreditCard, Settings, LogOut,
  Search, Package, X, Image as ImageIcon, Send, Monitor, Smartphone,
  Mail, RefreshCw, Code2, ChevronLeft, ChevronRight, Wand2, ArrowRight, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/hooks/use-session'
import { createClient } from '@/lib/supabase/client'
import { SHOT_STYLES, detectCategory, CATEGORY_LABELS, type ShotStyle } from '@/lib/product-shots'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step         = 'product' | 'scene' | 'result'
type ProductSrc   = 'upload' | 'shopify' | 'url'
type PreviewMode  = 'desktop' | 'mobile'
type BannerStyle  = 'minimal' | 'modern' | 'luxury' | 'dynamic' | 'ecommerce'
type BannerSize   = '1200x600' | '1080x1080' | '1080x1920' | '1920x1080'
type CampaignType = 'discount' | 'newproduct' | 'seasonal' | 'winback' | 'vip' | 'welcome' | 'blackfriday'

interface ProductInfo {
  name: string; price: string; description: string; category: string
}
interface DBProduct {
  id: string; productName: string; productImage: string | null; price: number | null; description: string | null
}
interface BannerContent { headline: string; subheadline: string; badge: string; discountLabel: string; ctaLabel: string }
interface BannerConfig  { campaignType: CampaignType; brandName: string; discountRate: string; discountType: 'percent' | 'fixed'; ctaText: string; style: BannerStyle; accentColor: string; size: BannerSize }
interface BannerImage   { url: string; index: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const BANNER_STYLES: Array<{ value: BannerStyle; label: string; bg: string }> = [
  { value: 'minimal',   label: 'Minimal',   bg: 'linear-gradient(135deg,#f0ecff,#ddd6fe)' },
  { value: 'modern',    label: 'Modern',    bg: 'linear-gradient(135deg,#1e1b4b,#312e81)' },
  { value: 'luxury',    label: 'Lüks',      bg: 'linear-gradient(135deg,#fdf6ee,#e8d5b7)' },
  { value: 'dynamic',   label: 'Dinamik',   bg: 'linear-gradient(135deg,#7c3aed,#db2777)' },
  { value: 'ecommerce', label: 'E-Ticaret', bg: 'linear-gradient(135deg,#eff6ff,#dbeafe)' },
]

const CAMPAIGN_TYPES: Array<{ value: CampaignType; label: string; emoji: string }> = [
  { value: 'discount', label: 'İndirim', emoji: '🏷️' },
  { value: 'newproduct', label: 'Yeni Ürün', emoji: '✨' },
  { value: 'seasonal', label: 'Sezonsal', emoji: '🌸' },
  { value: 'winback', label: 'Geri Kazanım', emoji: '💫' },
  { value: 'vip', label: 'VIP', emoji: '👑' },
  { value: 'welcome', label: 'Hoş Geldin', emoji: '👋' },
  { value: 'blackfriday', label: 'Black Friday', emoji: '🖤' },
]

const BANNER_SIZES: Array<{ value: BannerSize; label: string }> = [
  { value: '1200x600', label: '1200×600 (Email Hero)' },
  { value: '1080x1080', label: '1080×1080 (Kare)' },
  { value: '1080x1920', label: '1080×1920 (Story)' },
  { value: '1920x1080', label: '1920×1080 (Wide)' },
]

const ACCENT_COLORS = ['#6c47ff', '#2563eb', '#16a34a', '#d97706', '#dc2626', '#be185d']

const DEFAULT_CONFIG: BannerConfig = {
  campaignType: 'discount', brandName: '', discountRate: '',
  discountType: 'percent', ctaText: 'Alışverişe Başla',
  style: 'luxury', accentColor: '#6c47ff', size: '1200x600',
}
const DEFAULT_CONTENT: BannerContent = {
  headline: 'YAZA ÖZEL BÜYÜK İNDİRİM!', subheadline: 'Seçili ürünlerde sepette anında',
  badge: 'YAZ KOLEKSİYONU', discountLabel: '%40 İNDİRİM', ctaLabel: 'ALIŞVERİŞE BAŞLA',
}

function detectProductType(n: string) {
  const s = n.toLowerCase()
  if (/gözlük|güneş|sunglass|eyewear/.test(s)) return 'eyewear'
  if (/saat|watch/.test(s)) return 'watch'
  if (/parfüm|perfume|cologne/.test(s)) return 'perfume'
  if (/kozmetik|makyaj|serum|krem/.test(s)) return 'cosmetic'
  if (/kıyafet|elbise|gömlek|fashion/.test(s)) return 'fashion'
  if (/telefon|phone|laptop|tablet|tech/.test(s)) return 'tech'
  return 'product'
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text
}

function accentLuma(hex: string): number {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function getContrastColors(style: BannerStyle, accentColor: string) {
  const isDarkStyle = ['modern', 'dynamic'].includes(style)
  const isLuxury    = style === 'luxury'
  return {
    contentBg:     isDarkStyle ? '#0c0c18' : isLuxury ? '#fffdf7' : '#ffffff',
    footerBg:      isDarkStyle ? '#08080f' : isLuxury ? '#f5f2ea' : '#f8f9fa',
    textPrimary:   isDarkStyle ? '#f0f0f5' : '#111827',
    textSecondary: isDarkStyle ? 'rgba(255,255,255,0.55)' : '#6b7280',
    textMuted:     isDarkStyle ? 'rgba(255,255,255,0.3)'  : '#9ca3af',
    ctaBtnText:    accentLuma(accentColor) > 0.62 ? '#111827' : '#ffffff',
  }
}

const PRESET_TEMPLATES: Array<{
  id: string; name: string; emoji: string; preview: string
  config: Partial<BannerConfig>; content: BannerContent
}> = [
  {
    id: 'minimal-luxury',
    name: 'Minimal Luxury Sale',
    emoji: '✨',
    preview: 'linear-gradient(135deg,#fdf6ee,#e8d5b7)',
    config: { style: 'luxury', accentColor: '#b8860b', campaignType: 'discount' },
    content: { headline: 'ÖZEL SATIŞ', subheadline: 'Seçili ürünlerde sınırlı süre indirim', badge: 'LUXURY SALE', discountLabel: '%50 İNDİRİM', ctaLabel: 'KOLEKSİYONU KEŞFET' },
  },
  {
    id: 'product-spotlight',
    name: 'Product Spotlight',
    emoji: '🎯',
    preview: 'linear-gradient(135deg,#1e1b4b,#312e81)',
    config: { style: 'modern', accentColor: '#6c47ff', campaignType: 'newproduct' },
    content: { headline: 'YENİ ÜRÜN GELDİ', subheadline: 'Şimdi mağazamızda', badge: 'YENİ SEZON', discountLabel: 'ÖZEL LANSMAN', ctaLabel: 'HEMEN İNCELE' },
  },
  {
    id: 'new-collection',
    name: 'New Collection Launch',
    emoji: '🚀',
    preview: 'linear-gradient(135deg,#7c3aed,#db2777)',
    config: { style: 'dynamic', accentColor: '#db2777', campaignType: 'seasonal' },
    content: { headline: 'YENİ KOLEKSİYON', subheadline: 'Sezonun en yeni parçaları burada', badge: '2025 KOLEKSİYON', discountLabel: 'ŞİMDİ MEVCUT', ctaLabel: 'KOLEKSİYONU GÖR' },
  },
]

// ─── HTML export ─────────────────────────────────────────────────────────────
// Hero image (AI commercial shot) + content section below
// Gmail / Outlook / Apple Mail compatible — no absolute positioning, no flexbox

function generateHTML(config: BannerConfig, content: BannerContent, commercialShot?: string | null): string {
  const a      = config.accentColor
  const colors = getContrastColors(config.style, a)

  const hl = truncate(content.headline, 40)
  const sh = truncate(content.subheadline, 60)
  const dl = truncate(content.discountLabel, 20)
  const cl = truncate(content.ctaLabel, 25)
  const bg = truncate(content.badge, 22)

  // Fallback hero bgcolor when no image
  const heroBg: Record<BannerStyle, string> = {
    minimal:   '#e8e4ff',
    modern:    '#1e1b4b',
    luxury:    '#e8d5b7',
    dynamic:   '#7c3aed',
    ecommerce: '#dbeafe',
  }

  const heroSection = commercialShot
    ? `<!-- Hero: AI commercial shot — product preserved in premium scene -->
<tr>
  <td style="line-height:0;font-size:0;padding:0;margin:0;">
    <img src="${commercialShot}" width="600" alt="${hl}"
         style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;">
  </td>
</tr>`
    : `<!-- Hero placeholder when no shot generated -->
<tr>
  <td height="280" bgcolor="${heroBg[config.style] ?? '#e8e4ff'}"
      style="text-align:center;vertical-align:middle;padding:48px 40px;background-color:${heroBg[config.style] ?? '#e8e4ff'};">
    <p style="margin:0;font-size:32px;font-weight:900;color:${a};font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${dl}</p>
  </td>
</tr>`

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${hl}</title>
<style>
body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
img{-ms-interpolation-mode:bicubic;border:0;height:auto;line-height:100%;outline:none;text-decoration:none}
@media (max-width:480px){
  .email-body{padding:12px 0!important}
  .container{border-radius:12px!important}
  .content-pad{padding:24px 20px 28px!important}
  .hl{font-size:22px!important;line-height:1.2!important}
  .dl{font-size:28px!important}
  .cta-td{padding:0!important}
  .cta-a{padding:13px 24px!important;font-size:12px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Inter','Helvetica Neue',Arial,sans-serif;">

<table class="email-body" role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background-color:#f0f2f5;padding:20px 0;">
<tr><td align="center" style="padding:0 12px;">

<!-- Email container -->
<table class="container" role="presentation" width="600" cellpadding="0" cellspacing="0"
       style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;background-color:${colors.contentBg};">

<!-- Accent stripe at top (4px brand color) -->
<tr>
  <td bgcolor="${a}" height="4" style="line-height:0;font-size:0;background-color:${a};">&nbsp;</td>
</tr>

${heroSection}

<!-- Content section -->
<tr>
  <td class="content-pad" bgcolor="${colors.contentBg}"
      style="padding:32px 40px 40px;background-color:${colors.contentBg};">

    <!-- Badge -->
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        <td style="border-radius:6px;padding:4px 13px;background-color:${a}1a;">
          <span style="font-size:9px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;
                       color:${a};font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${bg}</span>
        </td>
      </tr>
    </table>

    <!-- Headline -->
    <h1 class="hl"
        style="margin:0 0 10px;font-size:28px;font-weight:900;color:${colors.textPrimary};
               letter-spacing:-0.025em;line-height:1.15;
               font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${hl}</h1>

    <!-- Subheadline -->
    <p style="margin:0 0 14px;font-size:14px;color:${colors.textSecondary};line-height:1.55;
              font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${sh}</p>

    <!-- Discount label -->
    <p class="dl"
       style="margin:0 0 28px;font-size:38px;font-weight:900;color:${a};
              letter-spacing:-0.04em;line-height:1;
              font-family:'Inter','Helvetica Neue',Arial,sans-serif;">${dl}</p>

    <!-- CTA button — Outlook-safe nested table -->
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td class="cta-td" bgcolor="${a}" style="border-radius:12px;background-color:${a};">
          <a href="#" class="cta-a"
             style="display:block;padding:15px 34px;font-size:13px;font-weight:700;
                    color:${colors.ctaBtnText};text-decoration:none;letter-spacing:0.06em;
                    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
                    background-color:${a};border-radius:12px;mso-padding-alt:15px 34px;">
            ${cl} &rarr;
          </a>
        </td>
      </tr>
    </table>

  </td>
</tr>

<!-- Footer -->
<tr>
  <td bgcolor="${colors.footerBg}"
      style="padding:14px 40px 16px;text-align:center;background-color:${colors.footerBg};">
    <p style="margin:0;font-size:11px;color:${colors.textMuted};
              font-family:'Inter','Helvetica Neue',Arial,sans-serif;">
      &copy; ${config.brandName || 'Marksio'} &nbsp;&bull;&nbsp;
      <a href="#" style="color:${a};text-decoration:none;">Aboneliği iptal et</a>
    </p>
  </td>
</tr>

</table>
</td></tr>
</table>

</body>
</html>`
}

// ─── BannerCanvas ─────────────────────────────────────────────────────────────
// bgImage = full AI commercial shot (product preserved in premium scene)
// productImage = only used for pre-generation preview (shows product on gradient bg)
// Layout: hero image card + content section below — matches the email HTML exactly

function BannerCanvas({ config, content, bgImage, productImage, compact, onClick, selected, mobileView }: {
  config: BannerConfig; content: BannerContent; bgImage?: string | null; productImage?: string | null
  compact?: boolean; onClick?: () => void; selected?: boolean; mobileView?: boolean
}) {
  const accent  = config.accentColor
  const styleDef = BANNER_STYLES.find(s => s.value === config.style)
  const colors  = getContrastColors(config.style, accent)
  const heroRatio = mobileView ? '1/1' : '2/1'
  const radius  = compact ? 8 : 14

  const containerStyle: React.CSSProperties = {
    borderRadius: radius,
    overflow: 'hidden',
    border: selected ? `2.5px solid ${accent}` : compact ? '1.5px solid rgba(0,0,0,0.07)' : 'none',
    boxShadow: selected
      ? `0 0 0 4px ${accent}25`
      : compact
        ? '0 2px 10px rgba(0,0,0,0.08)'
        : '0 12px 56px rgba(0,0,0,0.18)',
    cursor: onClick ? 'pointer' : 'default',
    transition: 'box-shadow 0.15s',
  }

  return (
    <div onClick={onClick} className="relative w-full" style={containerStyle}>

      {/* ─ HERO: AI commercial shot ─ */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: heroRatio, background: '#0a0a0a' }}>
        {bgImage ? (
          // After generation: full commercial shot — product is IN the image
          <img
            src={bgImage}
            alt={content.headline}
            className="w-full h-full object-cover"
            style={{ display: 'block' }}
            draggable={false}
          />
        ) : productImage ? (
          // Pre-generation preview: product centered on style gradient
          <>
            <div className="absolute inset-0" style={{ background: styleDef?.bg ?? 'linear-gradient(135deg,#f0ecff,#ddd6fe)' }} />
            <div className="absolute inset-0 flex items-center justify-center" style={{ padding: compact ? 12 : 24 }}>
              <img
                src={productImage}
                alt="Ürün"
                style={{
                  maxWidth: compact ? '55%' : '52%',
                  maxHeight: '80%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.38))',
                  display: 'block',
                }}
                draggable={false}
              />
            </div>
            {/* Subtle vignette */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.18) 100%)' }} />
          </>
        ) : (
          // Empty state
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
            style={{ background: styleDef?.bg ?? 'linear-gradient(135deg,#f0ecff,#ddd6fe)' }}>
            <Sparkles className={compact ? 'w-4 h-4' : 'w-7 h-7'} style={{ color: `${accent}80` }} />
            {!compact && <p className="text-[11px] font-medium" style={{ color: `${accent}80` }}>AI kreatif burada görünecek</p>}
          </div>
        )}

        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center z-10"
            style={{ background: accent, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* ─ CONTENT SECTION: badge, headline, discount, CTA ─ */}
      <div style={{
        background: colors.contentBg,
        padding: compact ? '9px 12px 10px' : mobileView ? '18px 20px 20px' : '22px 28px 26px',
      }}>
        {/* Accent stripe at top of content (mimics email 4px bar) */}
        <div style={{ height: compact ? 2 : 3, background: accent, borderRadius: 2, marginBottom: compact ? 6 : 12, width: compact ? 24 : 40 }} />

        {!compact && (
          <span style={{
            fontSize: mobileView ? 8 : 9,
            fontWeight: 700,
            color: accent,
            background: `${accent}18`,
            padding: '3px 9px',
            borderRadius: 4,
            letterSpacing: '2px',
            textTransform: 'uppercase' as const,
            display: 'inline-block',
            marginBottom: mobileView ? 7 : 10,
          }}>
            {truncate(content.badge, 20)}
          </span>
        )}

        <h2 style={{
          margin: 0,
          fontSize: compact ? 10 : mobileView ? 15 : 18,
          fontWeight: 900,
          color: colors.textPrimary,
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          marginBottom: compact ? 2 : 5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
        } as React.CSSProperties}>
          {truncate(content.headline, compact ? 24 : 46)}
        </h2>

        {!compact && (
          <p style={{
            margin: '0 0 6px',
            fontSize: mobileView ? 10 : 12,
            color: colors.textSecondary,
            lineHeight: 1.45,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            {truncate(content.subheadline, 55)}
          </p>
        )}

        <p style={{
          margin: `0 0 ${compact ? 0 : mobileView ? 10 : 14}px`,
          fontSize: compact ? 11 : mobileView ? 20 : 26,
          fontWeight: 900,
          color: accent,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}>
          {truncate(content.discountLabel, 20)}
        </p>

        {!compact && (
          <div style={{
            display: 'inline-block',
            background: accent,
            color: colors.ctaBtnText,
            padding: mobileView ? '8px 16px' : '10px 22px',
            borderRadius: 9,
            fontSize: mobileView ? 10 : 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap' as const,
          }}>
            {truncate(content.ctaLabel, 22)} →
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Form helpers ─────────────────────────────────────────────────────────────

const FL = ({ c }: { c: string }) => <label className="block text-[11px] font-semibold mb-1.5" style={{ color: '#6b7280' }}>{c}</label>

function FI({ v, o, ph, type = 'text' }: { v: string; o: (x: string) => void; ph?: string; type?: string }) {
  return <input type={type} value={v} onChange={e => o(e.target.value)} placeholder={ph}
    className="w-full rounded-xl text-[13px] outline-none transition-all"
    style={{ padding: '10px 13px', background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827' }}
    onFocus={e => (e.currentTarget.style.borderColor = '#6c47ff')}
    onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
}

function FS({ v, o, children }: { v: string; o: (x: string) => void; children: React.ReactNode }) {
  return <div className="relative">
    <select value={v} onChange={e => o(e.target.value)} className="w-full rounded-xl text-[13px] outline-none appearance-none"
      style={{ padding: '10px 32px 10px 13px', background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827' }}>
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#9ca3af' }} />
  </div>
}

// ─── Action Sheet ──────────────────────────────────────────────────────────────

function CampaignActionSheet({ onClose, onNewCampaign, onSaveTemplate, onAutomation }: {
  onClose: () => void; onNewCampaign: () => void; onSaveTemplate: () => void; onAutomation: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ background: '#fff', boxShadow: '0 -24px 64px rgba(0,0,0,0.2)' }}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#e5e7eb' }} />
        </div>
        <div className="px-6 pb-2 pt-3">
          <p className="text-[16px] font-bold" style={{ color: '#111827' }}>Kampanyada Kullan</p>
          <p className="text-[13px] mt-0.5" style={{ color: '#9ca3af' }}>Bu banner ile ne yapmak istersiniz?</p>
        </div>
        <div className="px-4 pb-6 space-y-2 mt-2">
          {([
            { icon: '📧', title: 'Yeni Email Kampanyası Oluştur', desc: 'Bu banner ile sıfırdan kampanya başlat', color: '#6c47ff', action: onNewCampaign },
            { icon: '➕', title: 'Mevcut Kampanyaya Ekle',        desc: 'Var olan kampanya görselini güncelle',   color: '#2563eb', action: () => { onClose(); } },
            { icon: '💾', title: 'Şablon Olarak Kaydet',          desc: 'AI Assets kütüphanesine kaydet',        color: '#16a34a', action: onSaveTemplate },
            { icon: '⚡', title: 'Otomasyonda Kullan',            desc: 'Email otomasyonuna banner ekle',        color: '#d97706', action: onAutomation },
          ] as Array<{ icon: string; title: string; desc: string; color: string; action: () => void }>).map(({ icon, title, desc, color, action }) => (
            <button key={title} onClick={action}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
              style={{ background: '#fafafa', border: '1.5px solid #f3f4f6' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.background = color + '08' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f3f4f6'; e.currentTarget.style.background = '#fafafa' }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: color + '14' }}>{icon}</div>
              <div>
                <p className="text-[13px] font-bold" style={{ color: '#111827' }}>{title}</p>
                <p className="text-[12px]" style={{ color: '#9ca3af' }}>{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 ml-auto shrink-0" style={{ color: '#d1d5db' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Test Mail Modal ───────────────────────────────────────────────────────────

function TestMailModal({ onClose, html, storeName }: { onClose: () => void; html: string; storeName?: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  async function send() {
    if (!email.trim()) { setErr('E-posta gerekli.'); return }
    setLoading(true); setErr('')
    try {
      const r = await fetch('/api/ai/banner-test-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), bannerHtml: html, storeName }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSent(true)
    } catch (e) { setErr((e as Error).message) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}>
      <div className="w-[380px] rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #f3f4f6' }}>
          <p className="text-[14px] font-bold" style={{ color: '#111827' }}>Test Mail Gönder</p>
          <button onClick={onClose}><X className="w-4 h-4" style={{ color: '#9ca3af' }} /></button>
        </div>
        <div className="p-5 space-y-4">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: '#f0fdf4' }}><Check className="w-6 h-6" style={{ color: '#16a34a' }} /></div>
              <p className="text-[14px] font-bold" style={{ color: '#111827' }}>Gönderildi!</p>
              <button onClick={onClose} className="mt-3 px-5 py-2 rounded-xl text-[12px] font-semibold" style={{ background: '#f5f3ff', color: '#6c47ff' }}>Kapat</button>
            </div>
          ) : (
            <>
              <div><FL c="E-posta Adresi" /><FI v={email} o={setEmail} ph="ornek@mail.com" type="email" /></div>
              {err && <p className="text-[11px]" style={{ color: '#dc2626' }}>{err}</p>}
              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#374151' }}>İptal</button>
                <button onClick={send} disabled={loading} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff' }}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Header (shared across steps) ─────────────────────────────────────────────

function StudioHeader({ step, credits, user, notifRef, userRef, notifOpen, setNotifOpen, userMenuOpen, setUserMenuOpen, router, handleSignOut }: {
  step: Step; credits: number
  user: { name?: string; email?: string; storeName?: string } | undefined
  notifRef: React.RefObject<HTMLDivElement>; userRef: React.RefObject<HTMLDivElement>
  notifOpen: boolean; setNotifOpen: (v: boolean) => void
  userMenuOpen: boolean; setUserMenuOpen: (v: boolean) => void
  router: ReturnType<typeof useRouter>; handleSignOut: () => void
}) {
  const STEP_LABELS: Record<Step, string> = { product: 'Ürün', scene: 'Sahne', result: 'Sonuç' }
  const STEPS: Step[] = ['product', 'scene', 'result']

  return (
    <header className="flex items-center justify-between px-6 shrink-0" style={{ height: 56, background: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.07)', zIndex: 20 }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[14px] font-bold" style={{ color: '#111827' }}>AI Studio</span>
        </div>
        <div className="hidden sm:flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: '#d1d5db' }} />}
              <span className={cn('text-[12px] font-semibold px-2 py-0.5 rounded-lg', step === s ? 'text-[#6c47ff]' : 'text-[#9ca3af]')}
                style={{ background: step === s ? '#f5f3ff' : 'transparent' }}>
                {STEP_LABELS[s]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl" style={{ background: '#f5f3ff', border: '1px solid #ede9fe' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: '#6c47ff' }} />
          <span className="text-[12px] font-semibold" style={{ color: '#6c47ff' }}>{credits.toLocaleString('tr-TR')}</span>
        </div>

        <div ref={notifRef} className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <Bell className="w-4 h-4" style={{ color: '#6b7280' }} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: '#6c47ff' }}>3</span>
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl z-50" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #f3f4f6' }}><p className="text-[13px] font-semibold" style={{ color: '#111827' }}>Bildirimler</p></div>
              {[{ i: '📬', t: 'Kampanya gönderildi', s: '2 saat önce' }, { i: '📈', t: 'Açılma oranı %38.7', s: '1 gün önce' }, { i: '🎯', t: '245 yeni müşteri', s: 'Bu hafta' }]
                .map((n, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer" style={{ borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                    <span className="text-base">{n.i}</span>
                    <div><p className="text-[12px] font-semibold" style={{ color: '#111827' }}>{n.t}</p><p className="text-[11px]" style={{ color: '#9ca3af' }}>{n.s}</p></div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div ref={userRef} className="relative">
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-xl" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0" style={{ background: '#6c47ff' }}>{user?.name?.[0]?.toUpperCase() ?? 'M'}</div>
            <div className="text-left">
              <p className="text-[12px] font-semibold leading-tight" style={{ color: '#111827' }}>{user?.storeName ?? 'Markus Store'}</p>
              <p className="text-[10px]" style={{ color: '#9ca3af' }}>Pro Plan</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl z-50" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <p className="text-[12px] font-semibold" style={{ color: '#111827' }}>{user?.name ?? 'Kullanıcı'}</p>
                <p className="text-[11px]" style={{ color: '#9ca3af' }}>{user?.email ?? ''}</p>
              </div>
              {([
                { Icon: Store,      label: 'Mağaza Ayarları', href: '/settings' },
                { Icon: CreditCard, label: 'Plan & Billing',  href: '/plans' },
                { Icon: Settings,   label: 'Hesap Ayarları',  href: '/settings' },
              ] as Array<{ Icon: React.ElementType; label: string; href: string }>).map(({ Icon, label, href }) => (
                <button key={label} onClick={() => { router.push(href); setUserMenuOpen(false) }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-left hover:bg-gray-50" style={{ color: '#374151' }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} /> {label}
                </button>
              ))}
              <div style={{ borderTop: '1px solid #f3f4f6' }}>
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-left hover:bg-red-50" style={{ color: '#dc2626' }}>
                  <LogOut className="w-3.5 h-3.5" /> Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AIStudioPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as { name?: string; email?: string; storeName?: string } | undefined

  // Step
  const [step, setStep] = useState<Step>('product')

  // Product
  const [productSrc, setProductSrc]           = useState<ProductSrc>('upload')
  const [productImage, setProductImage]       = useState<string | null>(null)
  const [productInfo, setProductInfo]         = useState<ProductInfo>({ name: '', price: '', description: '', category: '' })
  const [dbProducts, setDbProducts]           = useState<DBProduct[]>([])
  const [dbLoading, setDbLoading]             = useState(false)
  const [dbSearch, setDbSearch]               = useState('')
  const [selectedDbProduct, setSelectedDbProduct] = useState<DBProduct | null>(null)
  const [productUrlInput, setProductUrlInput] = useState('')
  const [urlPreviewOk, setUrlPreviewOk]       = useState<boolean | null>(null)
  const [uploadLoading, setUploadLoading]     = useState(false)

  // Shot style
  const [shotStyle, setShotStyle] = useState<ShotStyle>('auto')
  const [extraNotes, setExtraNotes] = useState('')

  // Generation
  const [generating, setGenerating]         = useState(false)
  const [desktopUrl, setDesktopUrl]         = useState<string | null>(null)
  const [mobileUrl, setMobileUrl]           = useState<string | null>(null)
  // Legacy compat for BannerCanvas
  const [images, setImages]                 = useState<BannerImage[]>([])
  const [error, setError]                   = useState('')

  // Banner
  const [content, setContent]               = useState<BannerContent>(DEFAULT_CONTENT)
  const [config, setConfig]                 = useState<BannerConfig>({ ...DEFAULT_CONFIG, brandName: user?.storeName ?? '' })
  const [previewMode, setPreviewMode]       = useState<PreviewMode>('desktop')

  // UI
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [testMailOpen, setTestMailOpen]       = useState(false)
  const [copied, setCopied]                   = useState(false)
  const [downloading, setDownloading]         = useState(false)
  const [credits]                             = useState(12450)
  const [notifOpen, setNotifOpen]             = useState(false)
  const [userMenuOpen, setUserMenuOpen]       = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef  = useRef<HTMLDivElement>(null)
  const fileRef  = useRef<HTMLInputElement>(null)

  const resolvedProductImage = productImage ?? selectedDbProduct?.productImage ?? null
  const resolvedProductName  = selectedDbProduct?.productName ?? productInfo.name
  const currentBg            = previewMode === 'mobile' ? (mobileUrl ?? desktopUrl) : (desktopUrl ?? mobileUrl)
  // HTML uses the commercial shot as hero image — product is already IN the shot
  const currentHtml          = generateHTML(config, content, currentBg)


  const setC = <K extends keyof BannerConfig>(k: K) => (v: BannerConfig[K]) => setConfig(c => ({ ...c, [k]: v }))
  const setT = <K extends keyof BannerContent>(k: K) => (v: string) => setContent(c => ({ ...c, [k]: v }))

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Load Shopify products
  const loadDbProducts = useCallback(async () => {
    if (dbProducts.length > 0) return
    setDbLoading(true)
    try { const r = await fetch('/api/products'); if (r.ok) setDbProducts(await r.json()) }
    catch { /* silent */ } finally { setDbLoading(false) }
  }, [dbProducts.length])

  // File upload
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadLoading(true)
    const reader = new FileReader()
    reader.onload = e => { setProductImage(e.target?.result as string); setUploadLoading(false) }
    reader.readAsDataURL(file)
  }, [])

  // URL validate
  const validateUrl = useCallback((url: string) => {
    if (!url.trim()) { setUrlPreviewOk(null); return }
    const img = new Image()
    img.onload  = () => { setProductImage(url); setUrlPreviewOk(true) }
    img.onerror = () => { setProductImage(null); setUrlPreviewOk(false) }
    img.src = url
  }, [])

  // Switch product source
  const switchSrc = useCallback((s: ProductSrc) => {
    setProductSrc(s)
    setProductImage(null)
    setSelectedDbProduct(null)
    setProductUrlInput('')
    setUrlPreviewOk(null)
    if (s === 'shopify') loadDbProducts()
  }, [loadDbProducts])

  // Can proceed to scene?
  const hasProduct = (productSrc === 'upload' && !!productImage) ||
                     (productSrc === 'shopify' && !!selectedDbProduct) ||
                     (productSrc === 'url' && urlPreviewOk === true)

  // Prefetch scene background
  // Generate commercial shot
  const generate = useCallback(async () => {
    if (!hasProduct) { setError('Ürün ekleyin.'); return }
    setGenerating(true); setError('')

    try {
      const body = {
        brandName: config.brandName || user?.storeName || 'Marka',
        productName: resolvedProductName || extraNotes || 'Ürün',
        campaignType: config.campaignType,
        discountRate: config.discountRate,
        discountType: config.discountType,
        ctaText: config.ctaText,
        style: config.style,
        accentColor: config.accentColor,
        size: config.size,
        productSource: productSrc,
        productImageUrl: resolvedProductImage,
        shotStyle,
      }
      const r = await fetch('/api/ai/banner-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json() as {
        error?: string
        content?: BannerContent
        desktop?: { url: string } | null
        mobile?: { url: string } | null
        images?: BannerImage[]
        category?: string
        effectiveStyle?: string
      }
      if (!r.ok) throw new Error(d.error)
      if (d.content) setContent(d.content)
      setDesktopUrl(d.desktop?.url ?? null)
      setMobileUrl(d.mobile?.url ?? null)
      setImages((d.images ?? []).filter(Boolean) as BannerImage[])
      if (!d.desktop?.url && !d.mobile?.url) throw new Error('Görsel üretilemedi.')
      setPreviewMode('desktop')
      setStep('result')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [hasProduct, shotStyle, extraNotes, config, user, resolvedProductName, resolvedProductImage, productSrc])

  // Campaign actions
  function saveAsset(status: string) {
    const id = `asset_${Date.now()}`
    const assets = JSON.parse(localStorage.getItem('marksio_ai_assets') ?? '[]') as unknown[]
    const styleLabel = SHOT_STYLES.find(s => s.id === shotStyle)?.name ?? shotStyle
    assets.unshift({
      id, html: currentHtml,
      bgImageUrl: desktopUrl,
      mobileImageUrl: mobileUrl,
      productImage: resolvedProductImage,
      config, content, status,
      createdAt: Date.now(),
      sceneName: styleLabel,
    })
    localStorage.setItem('marksio_ai_assets', JSON.stringify(assets.slice(0, 50)))
    return id
  }

  function handleNewCampaign() {
    const id = saveAsset('in_campaign')
    localStorage.setItem(`marksio_banner_asset_${id}`, JSON.stringify({ html: currentHtml, bgImageUrl: currentBg, productImage: resolvedProductImage, config, content }))
    router.push(`/campaigns/new?bannerId=${id}`)
  }

  function handleSaveTemplate() {
    saveAsset('draft')
    setActionSheetOpen(false)
    alert('Şablon AI Assets kütüphanesine kaydedildi.')
  }

  function handleAutomation() {
    const id = saveAsset('in_automation')
    localStorage.setItem(`marksio_banner_asset_${id}`, JSON.stringify({ html: currentHtml, bgImageUrl: currentBg, productImage: resolvedProductImage, config, content }))
    router.push(`/automations/new?bannerId=${id}`)
  }

  function copyHTML() {
    navigator.clipboard.writeText(currentHtml).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  async function handleDownload() {
    const url = previewMode === 'mobile' ? (mobileUrl ?? desktopUrl) : (desktopUrl ?? mobileUrl)
    if (!url || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `marksio-banner-${Date.now()}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch {
      window.open(url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  async function handleSignOut() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const filteredDbProducts = dbProducts.filter(p => p.productName.toLowerCase().includes(dbSearch.toLowerCase()))

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <AppShell>
      {actionSheetOpen && <CampaignActionSheet onClose={() => setActionSheetOpen(false)} onNewCampaign={handleNewCampaign} onSaveTemplate={handleSaveTemplate} onAutomation={handleAutomation} />}
      {testMailOpen && <TestMailModal onClose={() => setTestMailOpen(false)} html={currentHtml} storeName={user?.storeName} />}

      <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#f2f2f7' }}>
        <StudioHeader step={step} credits={credits} user={user} notifRef={notifRef} userRef={userRef} notifOpen={notifOpen} setNotifOpen={setNotifOpen} userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} router={router} handleSignOut={handleSignOut} />

        {/* ════ STEP 1: ÜRÜN ════ */}
        {step === 'product' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 p-6 flex items-start justify-center">
              <div className="w-full max-w-2xl">
                <div className="mb-6 text-center">
                  <h2 className="text-[22px] font-bold" style={{ color: '#111827', letterSpacing: '-0.025em' }}>Ürün Ekle</h2>
                  <p className="text-[14px] mt-1" style={{ color: '#9ca3af' }}>Ürün görseli yükle veya Shopify'dan seç. AI sahneyi buna göre oluşturur.</p>
                </div>

                {/* Source tabs */}
                <div className="flex items-center gap-1 p-1 rounded-2xl mb-6 w-fit mx-auto" style={{ background: '#f3f4f6' }}>
                  {([['upload', Upload, 'Görsel Yükle'], ['shopify', ShoppingBag, 'Shopify'], ['url', Link2, 'URL']] as [ProductSrc, React.ElementType, string][])
                    .map(([src, Icon, label]) => (
                      <button key={src} onClick={() => switchSrc(src)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all"
                        style={{ background: productSrc === src ? '#fff' : 'transparent', color: productSrc === src ? '#6c47ff' : '#9ca3af', boxShadow: productSrc === src ? '0 1px 6px rgba(0,0,0,0.08)' : 'none' }}>
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left: Image */}
                  <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                    <p className="text-[13px] font-bold mb-3" style={{ color: '#111827' }}>Ürün Görseli</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

                    {productSrc === 'upload' && (
                      resolvedProductImage ? (
                        <div className="relative rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb' }}>
                          <img src={resolvedProductImage} className="w-full h-48 object-contain bg-gray-50" />
                          <button onClick={() => { setProductImage(null); if (fileRef.current) fileRef.current.value = '' }} className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                            <X className="w-3.5 h-3.5 text-white" />
                          </button>
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(108,71,255,0.9)', color: '#fff' }}>✓ Ürün korunacak</div>
                        </div>
                      ) : (
                        <button onClick={() => fileRef.current?.click()} disabled={uploadLoading}
                          className="w-full rounded-xl flex flex-col items-center justify-center gap-3 transition-all"
                          style={{ height: 192, border: '2px dashed #d1d5db', background: '#fafafa' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#6c47ff'; e.currentTarget.style.background = '#f5f3ff' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.background = '#fafafa' }}>
                          {uploadLoading ? <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#6c47ff' }} /> : (
                            <>
                              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f0ecff' }}>
                                <Upload className="w-7 h-7" style={{ color: '#6c47ff' }} />
                              </div>
                              <div className="text-center">
                                <p className="text-[13px] font-bold" style={{ color: '#374151' }}>Görsel sürükle veya seç</p>
                                <p className="text-[11px] mt-1" style={{ color: '#9ca3af' }}>PNG, JPG, WebP, SVG • Maks 5MB</p>
                              </div>
                            </>
                          )}
                        </button>
                      )
                    )}

                    {productSrc === 'shopify' && (
                      <div className="space-y-2.5">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
                          <input value={dbSearch} onChange={e => setDbSearch(e.target.value)} placeholder="Ürün ara..." className="w-full text-[13px] outline-none rounded-xl" style={{ paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827' }} />
                        </div>
                        {dbLoading ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" style={{ color: '#6c47ff' }} /></div> :
                          filteredDbProducts.length === 0 ? <p className="text-center py-5 text-[13px]" style={{ color: '#9ca3af' }}>{dbProducts.length === 0 ? 'Shopify entegrasyonu gerekli' : 'Bulunamadı'}</p> : (
                            <div className="space-y-2 max-h-44 overflow-y-auto">
                              {filteredDbProducts.map(p => (
                                <button key={p.id} onClick={() => { setSelectedDbProduct(p); setProductImage(p.productImage); setProductInfo(i => ({ ...i, name: p.productName, price: p.price?.toString() ?? '', description: p.description ?? '' })) }}
                                  className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all"
                                  style={{ border: selectedDbProduct?.id === p.id ? '1.5px solid #6c47ff' : '1.5px solid #e5e7eb', background: selectedDbProduct?.id === p.id ? '#f5f3ff' : '#fff' }}>
                                  {p.productImage ? <img src={p.productImage} className="w-10 h-10 rounded-lg object-cover shrink-0" /> : <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#f3f4f6' }}><Package className="w-4 h-4" style={{ color: '#9ca3af' }} /></div>}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold truncate" style={{ color: '#111827' }}>{p.productName}</p>
                                    {p.price && <p className="text-[11px]" style={{ color: '#6c47ff' }}>₺{p.price.toFixed(2)}</p>}
                                  </div>
                                  {selectedDbProduct?.id === p.id && <Check className="w-4 h-4 shrink-0" style={{ color: '#6c47ff' }} />}
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    )}

                    {productSrc === 'url' && (
                      <div className="space-y-3">
                        <FI v={productUrlInput} o={v => { setProductUrlInput(v); validateUrl(v) }} ph="https://cdn.ornek.com/urun.jpg" />
                        {urlPreviewOk === false && <p className="text-[11px]" style={{ color: '#dc2626' }}>Görsel yüklenemedi. URL'yi kontrol edin.</p>}
                        {productImage && urlPreviewOk && <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #e5e7eb' }}><img src={productImage} className="w-full h-36 object-contain bg-gray-50" /></div>}
                      </div>
                    )}
                  </div>

                  {/* Right: Product info */}
                  <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                    <p className="text-[13px] font-bold" style={{ color: '#111827' }}>Ürün Bilgileri</p>
                    <div><FL c="Ürün Adı" /><FI v={productInfo.name} o={v => setProductInfo(i => ({ ...i, name: v }))} ph="Yaz Koleksiyonu Gözlüğü" /></div>
                    <div><FL c="Marka Adı" /><FI v={config.brandName} o={setC('brandName')} ph="Markus Store" /></div>
                    <div><FL c="Fiyat (opsiyonel)" /><FI v={productInfo.price} o={v => setProductInfo(i => ({ ...i, price: v }))} ph="₺299" /></div>
                    <div><FL c="Kategori" />
                      <FI v={productInfo.category} o={v => setProductInfo(i => ({ ...i, category: v }))} ph="Gözlük / Aksesuar" />
                    </div>
                    <div>
                      <FL c="Kampanya Tipi" />
                      <FS v={config.campaignType} o={v => setC('campaignType')(v as CampaignType)}>
                        {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                      </FS>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1"><FL c="İndirim" /><FI v={config.discountRate} o={setC('discountRate')} ph="%40" /></div>
                      <div className="w-24"><FL c="Tür" />
                        <FS v={config.discountType} o={v => setC('discountType')(v as 'percent' | 'fixed')}>
                          <option value="percent">%</option>
                          <option value="fixed">₺</option>
                        </FS>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next */}
                <div className="mt-6 flex items-center justify-center gap-4">
                  {!hasProduct && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                      <AlertCircle className="w-4 h-4" style={{ color: '#d97706' }} />
                      <p className="text-[12px]" style={{ color: '#92400e' }}>Devam etmek için ürün görseli ekleyin</p>
                    </div>
                  )}
                  <button onClick={() => hasProduct && setStep('scene')} disabled={!hasProduct}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all"
                    style={{ background: hasProduct ? 'linear-gradient(135deg,#6c47ff,#9c40ff)' : '#e5e7eb', color: hasProduct ? '#fff' : '#9ca3af', boxShadow: hasProduct ? '0 4px 20px rgba(108,71,255,0.38)' : 'none', cursor: hasProduct ? 'pointer' : 'not-allowed' }}>
                    Sahne Seç <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP 2: ÇEKİM STİLİ ════ */}
        {step === 'scene' && (
          <div className="flex-1 overflow-y-auto" style={{ background: '#f8f9fc' }}>
            <div className="max-w-2xl mx-auto p-6">

              {/* Preset Templates */}
              <div className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Hazır Şablonlar</p>
                <div className="grid grid-cols-3 gap-3">
                  {PRESET_TEMPLATES.map(tpl => (
                    <button key={tpl.id}
                      onClick={() => {
                        setConfig(c => ({ ...c, ...tpl.config }))
                        setContent(tpl.content)
                      }}
                      className="flex flex-col items-start p-3 rounded-2xl text-left transition-all"
                      style={{ background: '#fff', border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = tpl.config.accentColor ?? '#6c47ff'; e.currentTarget.style.boxShadow = `0 0 0 3px ${tpl.config.accentColor ?? '#6c47ff'}18` }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div className="w-full h-10 rounded-xl mb-2" style={{ background: tpl.preview }} />
                      <span className="text-[11px] font-semibold" style={{ color: '#111827' }}>{tpl.emoji} {tpl.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => setStep('product')} className="flex items-center gap-1.5 text-[13px] font-semibold transition-colors shrink-0" style={{ color: '#9ca3af' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#6c47ff')} onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                  <ChevronLeft className="w-4 h-4" /> Geri
                </button>
                <div>
                  <h2 className="text-[22px] font-bold" style={{ color: '#111827', letterSpacing: '-0.03em' }}>Çekim Stili</h2>
                  <p className="text-[13px]" style={{ color: '#9ca3af' }}>
                    AI ürününü alıp profesyonel ticari fotoğrafa dönüştürür — sahne ve ortamı otomatik seçer.
                  </p>
                </div>
              </div>

              {/* Detected product category */}
              {resolvedProductName && (
                <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl mb-5" style={{ background: '#fff', border: '1px solid rgba(108,71,255,0.15)' }}>
                  <span className="text-xl">{CATEGORY_LABELS[detectCategory(resolvedProductName)].split(' ')[0]}</span>
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: '#374151' }}>
                      Tespit edilen ürün: <span style={{ color: '#6c47ff' }}>{CATEGORY_LABELS[detectCategory(resolvedProductName)]}</span>
                    </p>
                    <p className="text-[11px]" style={{ color: '#9ca3af' }}>AI bu kategoriye özel çekim ortamı oluşturacak</p>
                  </div>
                </div>
              )}

              {/* 5 Shot style cards */}
              <div className="space-y-2.5 mb-5">
                {SHOT_STYLES.map(style => {
                  const isSelected = shotStyle === style.id
                  return (
                    <button key={style.id} onClick={() => setShotStyle(style.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                      style={{
                        background: isSelected ? '#fff' : '#fff',
                        border: isSelected ? '2px solid #6c47ff' : '1.5px solid rgba(0,0,0,0.07)',
                        boxShadow: isSelected ? '0 0 0 4px rgba(108,71,255,0.08), 0 4px 16px rgba(0,0,0,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                      {/* Emoji */}
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                        style={{ background: isSelected ? 'rgba(108,71,255,0.08)' : '#f9fafb' }}>
                        {style.emoji}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[14px] font-bold" style={{ color: '#111827' }}>{style.name}</p>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                            {style.examples}
                          </span>
                        </div>
                        <p className="text-[12px]" style={{ color: '#6b7280' }}>{style.description}</p>
                      </div>

                      {/* Selected indicator */}
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all',
                        isSelected ? 'opacity-100' : 'opacity-0')}
                        style={{ background: '#6c47ff' }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Optional extra notes */}
              <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
                <p className="text-[12px] font-bold mb-2" style={{ color: '#374151' }}>Özel Not <span className="font-normal text-[11px]" style={{ color: '#9ca3af' }}>(opsiyonel)</span></p>
                <textarea
                  value={extraNotes}
                  onChange={e => setExtraNotes(e.target.value)}
                  rows={2}
                  placeholder="Örn: siyah renk korunacak, spor ortam, suya dayanıklı görünüm..."
                  className="w-full rounded-xl text-[12px] outline-none resize-none"
                  style={{ padding: '10px 13px', background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827', lineHeight: 1.6 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#6c47ff')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
              </div>

              {/* Banner settings */}
              <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.07)' }}>
                <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9ca3af' }}>Banner Ayarları</p>
                <div className="grid grid-cols-3 gap-4">
                  <div><FL c="Aksent Rengi" />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {ACCENT_COLORS.map(c => <button key={c} onClick={() => setC('accentColor')(c)} className="rounded-full" style={{ width: 24, height: 24, background: c, boxShadow: config.accentColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }} />)}
                    </div>
                  </div>
                  <div><FL c="CTA Butonu" /><FI v={config.ctaText} o={setC('ctaText')} ph="Alışverişe Başla" /></div>
                  <div><FL c="Kampanya Tipi" />
                    <FS v={config.campaignType} o={v => setC('campaignType')(v as CampaignType)}>
                      {CAMPAIGN_TYPES.map(t => <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>)}
                    </FS>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <AlertCircle className="w-4 h-4" style={{ color: '#dc2626' }} />
                  <p className="text-[12px]" style={{ color: '#dc2626' }}>{error}</p>
                </div>
              )}

              {/* Generate */}
              <button onClick={generate} disabled={generating}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-[15px] font-bold transition-all"
                style={{
                  background: generating ? 'linear-gradient(135deg,#a78bfa,#c084fc)' : 'linear-gradient(135deg,#6c47ff,#9c40ff)',
                  color: '#fff',
                  boxShadow: generating ? 'none' : '0 8px 32px rgba(108,71,255,0.45)',
                  opacity: generating ? 0.85 : 1,
                }}>
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Profesyonel reklam fotoğrafı oluşturuluyor...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Reklam Fotoğrafı Oluştur</>
                )}
              </button>

              {generating && (
                <div className="text-center mt-3 space-y-1">
                  <p className="text-[12px] font-semibold" style={{ color: '#6c47ff' }}>
                    {SHOT_STYLES.find(s => s.id === shotStyle)?.emoji} {SHOT_STYLES.find(s => s.id === shotStyle)?.name}
                    {resolvedProductName && ` • ${CATEGORY_LABELS[detectCategory(resolvedProductName)]}`}
                  </p>
                  <p className="text-[11px]" style={{ color: '#9ca3af' }}>
                    flux-pro/kontext ile ürün kimliği korunarak profesyonel ticari çekim yapılıyor
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ STEP 3: SONUÇ ════ */}
        {step === 'result' && (
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Center: Desktop + Mobile preview */}
            <div className="flex-1 flex flex-col overflow-y-auto min-w-0" style={{ background: '#f2f4f8' }}>

              {/* Preview header */}
              <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep('scene')} className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors" style={{ color: '#9ca3af' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#6c47ff')} onMouseLeave={e => (e.currentTarget.style.color = '#9ca3af')}>
                    <ChevronLeft className="w-3.5 h-3.5" /> Farklı sahne
                  </button>
                  <div className="w-px h-4" style={{ background: '#e5e7eb' }} />
                  <p className="text-[13px] font-bold" style={{ color: '#111827' }}>
                    {SHOT_STYLES.find(s => s.id === shotStyle)?.emoji} {SHOT_STYLES.find(s => s.id === shotStyle)?.name}
                    {resolvedProductName && ` • ${CATEGORY_LABELS[detectCategory(resolvedProductName)]}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-0.5 rounded-xl" style={{ background: '#f3f4f6' }}>
                    {([['desktop', Monitor, 'Desktop Email'], ['mobile', Smartphone, 'Mobile Email']] as [PreviewMode, React.ElementType, string][]).map(([mode, Icon, label]) => (
                      <button key={mode} onClick={() => setPreviewMode(mode)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                        style={{ background: previewMode === mode ? '#fff' : 'transparent', color: previewMode === mode ? '#6c47ff' : '#9ca3af', boxShadow: previewMode === mode ? '0 1px 4px rgba(0,0,0,0.08)' : 'none' }}>
                        <Icon className="w-3 h-3" /> {label}
                      </button>
                    ))}
                  </div>
                  {resolvedProductImage && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      <Check className="w-3 h-3" /> Ürün korundu
                    </div>
                  )}
                </div>
              </div>

              {/* Preview area */}
              <div className="flex-1 flex items-start justify-center p-6 gap-6 overflow-auto">

                {previewMode === 'desktop' ? (
                  <div className="w-full max-w-3xl">
                    <BannerCanvas
                      config={config}
                      content={content}
                      bgImage={desktopUrl}
                      productImage={resolvedProductImage}
                      mobileView={false}
                    />
                    <p className="text-[10px] text-center mt-2" style={{ color: '#9ca3af' }}>Desktop Email — 1200×600px</p>
                  </div>
                ) : (
                  // Mobile phone mockup
                  <div className="flex flex-col items-center">
                    <div style={{ width: 320 }}>
                      <div className="rounded-3xl overflow-hidden" style={{ background: '#000', padding: '10px 8px', boxShadow: '0 24px 60px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.15)' }}>
                        <div className="rounded-2xl overflow-hidden" style={{ background: '#f3f4f6' }}>
                          {/* Status bar */}
                          <div className="flex items-center justify-between px-4 py-1" style={{ background: '#000' }}>
                            <span className="text-[9px] text-white font-semibold">9:41</span>
                            <div className="w-16 h-3 rounded-full" style={{ background: '#000' }} />
                            <div className="flex gap-1">
                              {[4,3,2].map(h => <div key={h} className="rounded-sm" style={{ width: 3, height: h + 4, background: '#fff' }} />)}
                            </div>
                          </div>
                          <div style={{ background: '#f4f4f4', padding: '8px 6px' }}>
                            <div className="rounded-xl overflow-hidden" style={{ background: '#fff' }}>
                              {/* Email sender header */}
                              <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0" style={{ background: config.accentColor }}>
                                  {(config.brandName || 'M')[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-[8px] font-semibold" style={{ color: '#111' }}>{config.brandName || 'Marka'}</p>
                                  <p className="text-[7px]" style={{ color: '#9ca3af' }}>info@marka.com</p>
                                </div>
                              </div>
                              {/* Mobile banner with BannerCanvas */}
                              <BannerCanvas
                                config={config}
                                content={content}
                                bgImage={mobileUrl ?? desktopUrl}
                                productImage={resolvedProductImage}
                                mobileView={true}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-center mt-3" style={{ color: '#9ca3af' }}>Mobile Email — 600×800px</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Edit + Actions */}
            <div className="w-[256px] shrink-0 flex flex-col overflow-hidden" style={{ background: '#fff', borderLeft: '1px solid rgba(0,0,0,0.07)' }}>
              <div className="px-4 pt-4 pb-2 flex items-center gap-2" style={{ borderBottom: '1px solid #f3f4f6' }}>
                <Layers className="w-3.5 h-3.5" style={{ color: '#9ca3af' }} />
                <p className="text-[13px] font-bold" style={{ color: '#111827' }}>Banner Düzenle</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {([
                  { l: 'Başlık',        k: 'headline' as keyof BannerContent },
                  { l: 'Alt Başlık',    k: 'subheadline' as keyof BannerContent },
                  { l: 'İndirim Metni', k: 'discountLabel' as keyof BannerContent },
                  { l: 'CTA',           k: 'ctaLabel' as keyof BannerContent },
                  { l: 'Badge',         k: 'badge' as keyof BannerContent },
                ] as Array<{ l: string; k: keyof BannerContent }>).map(({ l, k }) => (
                  <div key={k}>
                    <FL c={l} />
                    <input value={content[k]} onChange={e => setT(k)(e.target.value)}
                      className="w-full rounded-xl text-[12px] outline-none transition-all"
                      style={{ padding: '8px 12px', background: '#f9fafb', border: '1.5px solid #e5e7eb', color: '#111827' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#6c47ff')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')} />
                  </div>
                ))}
                <div>
                  <FL c="Marka Rengi" />
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACCENT_COLORS.map(c => <button key={c} onClick={() => setC('accentColor')(c)} className="rounded-full" style={{ width: 24, height: 24, background: c, boxShadow: config.accentColor === c ? `0 0 0 2px #fff, 0 0 0 3.5px ${c}` : 'none' }} />)}
                  </div>
                </div>

                {/* Preview info */}
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Üretilen Formatlar</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: '#374151' }}>🖥 Desktop</span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', desktopUrl ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100')}>
                      {desktopUrl ? '✓ 1200×600' : 'Yok'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: '#374151' }}>📱 Mobile</span>
                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', mobileUrl ? 'text-green-700 bg-green-50' : 'text-gray-400 bg-gray-100')}>
                      {mobileUrl ? '✓ 600×800' : 'Yok'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-4 space-y-2 shrink-0" style={{ borderTop: '1px solid #f3f4f6' }}>
                <div className="flex gap-2">
                  <button onClick={copyHTML} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all" style={{ background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}>
                    {copied ? <><Check className="w-3.5 h-3.5" style={{ color: '#16a34a' }} /> Kopyalandı</> : <><Code2 className="w-3.5 h-3.5" /> HTML</>}
                  </button>
                  <button onClick={() => setTestMailOpen(true)} className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                    <Mail className="w-3.5 h-3.5" /> Test Mail
                  </button>
                </div>

                <button onClick={handleDownload} disabled={downloading || (!desktopUrl && !mobileUrl)}
                  className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                  style={{ background: '#f5f3ff', color: '#6c47ff', border: '1px solid #ede9fe', opacity: (!desktopUrl && !mobileUrl) ? 0.4 : 1 }}>
                  {downloading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> İndiriliyor...</>
                    : <><ImageIcon className="w-3.5 h-3.5" /> Görseli İndir</>}
                </button>

                <button onClick={() => setActionSheetOpen(true)}
                  className="w-full py-3.5 rounded-2xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg,#6c47ff,#9c40ff)', color: '#fff', boxShadow: '0 6px 24px rgba(108,71,255,0.42)' }}>
                  <Send className="w-4 h-4" />
                  Kampanyada Kullan
                </button>

                <p className="text-[10px] text-center" style={{ color: '#9ca3af' }}>
                  Yeni kampanya • Şablon • Otomasyon
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
