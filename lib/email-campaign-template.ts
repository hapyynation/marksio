export type LayoutStyle =
  | 'luxury'
  | 'minimal'
  | 'black-friday'
  | 'skincare'
  | 'fashion'
  | 'tech'
  | 'furniture'
  | 'gaming'
  | 'default'

export interface Product {
  productName: string
  productImage?: string
  price?: string
  compareAtPrice?: string
  description?: string
  category?: string
  productUrl?: string
}

interface ThemeTokens {
  headerBg: string
  headerText: string
  headerSubtext: string
  ctaBg: string
  ctaText: string
  ctaRadius: string
  badgeBg: string
  badgeText: string
  discountBorderColor: string
  discountInnerBg: string
  discountTextMain: string
  discountTextSub: string
  bodyBg: string
  bodyText: string
  headlineColor: string
  footerBg: string
  footerBorder: string
  footerText: string
  footerLink: string
  cardBg: string
  cardBorder: string
  cardText: string
  cardPriceBg: string
}

const THEMES: Record<LayoutStyle, ThemeTokens> = {
  luxury: {
    headerBg: 'linear-gradient(135deg,#0a0a0a 0%,#1a1500 100%)',
    headerText: '#c9a84c',
    headerSubtext: 'rgba(201,168,76,0.6)',
    ctaBg: 'linear-gradient(135deg,#c9a84c 0%,#b8943e 100%)',
    ctaText: '#0a0a0a',
    ctaRadius: '4px',
    badgeBg: '#c9a84c',
    badgeText: '#0a0a0a',
    discountBorderColor: '#c9a84c',
    discountInnerBg: 'linear-gradient(135deg,#1a1500,#0d0d00)',
    discountTextMain: '#f5e68c',
    discountTextSub: '#c9a84c',
    bodyBg: '#ffffff',
    bodyText: '#333333',
    headlineColor: '#0a0a0a',
    footerBg: '#f8f6f0',
    footerBorder: '#e8e0c8',
    footerText: '#888',
    footerLink: '#7a6830',
    cardBg: '#fafaf7',
    cardBorder: '#e8d99a',
    cardText: '#1a1500',
    cardPriceBg: '#1a1500',
  },
  minimal: {
    headerBg: '#ffffff',
    headerText: '#111111',
    headerSubtext: '#999',
    ctaBg: '#111111',
    ctaText: '#ffffff',
    ctaRadius: '4px',
    badgeBg: '#111111',
    badgeText: '#ffffff',
    discountBorderColor: '#111',
    discountInnerBg: '#f7f7f7',
    discountTextMain: '#111',
    discountTextSub: '#555',
    bodyBg: '#ffffff',
    bodyText: '#555',
    headlineColor: '#111',
    footerBg: '#f7f7f7',
    footerBorder: '#ebebeb',
    footerText: '#bbb',
    footerLink: '#555',
    cardBg: '#fafafa',
    cardBorder: '#e5e5e5',
    cardText: '#111',
    cardPriceBg: '#111',
  },
  'black-friday': {
    headerBg: 'linear-gradient(135deg,#000000 0%,#1a1a1a 100%)',
    headerText: '#facc15',
    headerSubtext: 'rgba(250,204,21,0.6)',
    ctaBg: 'linear-gradient(135deg,#facc15 0%,#eab308 100%)',
    ctaText: '#000000',
    ctaRadius: '8px',
    badgeBg: '#facc15',
    badgeText: '#000000',
    discountBorderColor: '#facc15',
    discountInnerBg: '#000000',
    discountTextMain: '#facc15',
    discountTextSub: 'rgba(250,204,21,0.7)',
    bodyBg: '#ffffff',
    bodyText: '#333',
    headlineColor: '#000',
    footerBg: '#000',
    footerBorder: '#222',
    footerText: '#555',
    footerLink: '#facc15',
    cardBg: '#111',
    cardBorder: '#facc15',
    cardText: '#facc15',
    cardPriceBg: '#facc15',
  },
  skincare: {
    headerBg: 'linear-gradient(135deg,#f9f0e8 0%,#f0e6d8 100%)',
    headerText: '#7c4b3a',
    headerSubtext: '#c4957a',
    ctaBg: 'linear-gradient(135deg,#c4806a 0%,#a86754 100%)',
    ctaText: '#ffffff',
    ctaRadius: '100px',
    badgeBg: '#c4806a',
    badgeText: '#ffffff',
    discountBorderColor: '#c4806a',
    discountInnerBg: 'linear-gradient(135deg,#fff9f5,#fef0e8)',
    discountTextMain: '#7c4b3a',
    discountTextSub: '#c4806a',
    bodyBg: '#ffffff',
    bodyText: '#6b5245',
    headlineColor: '#4a2f22',
    footerBg: '#fdf6f0',
    footerBorder: '#f0e2d4',
    footerText: '#c0a090',
    footerLink: '#a86754',
    cardBg: '#fff9f5',
    cardBorder: '#f0cfc0',
    cardText: '#4a2f22',
    cardPriceBg: '#c4806a',
  },
  fashion: {
    headerBg: '#0d0d0d',
    headerText: '#ffffff',
    headerSubtext: 'rgba(255,255,255,0.5)',
    ctaBg: '#ffffff',
    ctaText: '#000000',
    ctaRadius: '0px',
    badgeBg: '#ffffff',
    badgeText: '#000000',
    discountBorderColor: '#fff',
    discountInnerBg: '#111',
    discountTextMain: '#fff',
    discountTextSub: 'rgba(255,255,255,0.6)',
    bodyBg: '#ffffff',
    bodyText: '#555',
    headlineColor: '#000',
    footerBg: '#0d0d0d',
    footerBorder: '#222',
    footerText: '#555',
    footerLink: '#fff',
    cardBg: '#fafafa',
    cardBorder: '#e8e8e8',
    cardText: '#000',
    cardPriceBg: '#000',
  },
  tech: {
    headerBg: 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
    headerText: '#60a5fa',
    headerSubtext: 'rgba(96,165,250,0.5)',
    ctaBg: 'linear-gradient(135deg,#3b82f6 0%,#2563eb 100%)',
    ctaText: '#ffffff',
    ctaRadius: '8px',
    badgeBg: '#3b82f6',
    badgeText: '#ffffff',
    discountBorderColor: '#3b82f6',
    discountInnerBg: 'linear-gradient(135deg,#0f172a,#1e293b)',
    discountTextMain: '#93c5fd',
    discountTextSub: '#60a5fa',
    bodyBg: '#ffffff',
    bodyText: '#475569',
    headlineColor: '#0f172a',
    footerBg: '#0f172a',
    footerBorder: '#1e293b',
    footerText: '#475569',
    footerLink: '#60a5fa',
    cardBg: '#f0f4ff',
    cardBorder: '#93c5fd',
    cardText: '#0f172a',
    cardPriceBg: '#2563eb',
  },
  furniture: {
    headerBg: 'linear-gradient(135deg,#3d2b1f 0%,#5c3d2e 100%)',
    headerText: '#e8c99a',
    headerSubtext: 'rgba(232,201,154,0.6)',
    ctaBg: 'linear-gradient(135deg,#8b6f47 0%,#7a5c37 100%)',
    ctaText: '#ffffff',
    ctaRadius: '6px',
    badgeBg: '#8b6f47',
    badgeText: '#ffffff',
    discountBorderColor: '#8b6f47',
    discountInnerBg: 'linear-gradient(135deg,#fdf8f0,#f5ede0)',
    discountTextMain: '#5c3d2e',
    discountTextSub: '#8b6f47',
    bodyBg: '#ffffff',
    bodyText: '#5c4033',
    headlineColor: '#3d2b1f',
    footerBg: '#fdf8f0',
    footerBorder: '#e8d8c4',
    footerText: '#b8977a',
    footerLink: '#7a5c37',
    cardBg: '#fdf8f0',
    cardBorder: '#d4b896',
    cardText: '#3d2b1f',
    cardPriceBg: '#7a5c37',
  },
  gaming: {
    headerBg: 'linear-gradient(135deg,#0a0a0f 0%,#130a1f 100%)',
    headerText: '#a78bfa',
    headerSubtext: 'rgba(167,139,250,0.5)',
    ctaBg: 'linear-gradient(135deg,#7c3aed 0%,#6d28d9 100%)',
    ctaText: '#ffffff',
    ctaRadius: '6px',
    badgeBg: '#7c3aed',
    badgeText: '#ffffff',
    discountBorderColor: '#7c3aed',
    discountInnerBg: 'linear-gradient(135deg,#0a0a0f,#130a1f)',
    discountTextMain: '#c4b5fd',
    discountTextSub: '#a78bfa',
    bodyBg: '#ffffff',
    bodyText: '#374151',
    headlineColor: '#111',
    footerBg: '#0a0a0f',
    footerBorder: '#1f1535',
    footerText: '#4b4b6b',
    footerLink: '#a78bfa',
    cardBg: '#0f0a1a',
    cardBorder: '#7c3aed',
    cardText: '#c4b5fd',
    cardPriceBg: '#7c3aed',
  },
  default: {
    headerBg: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
    headerText: '#ffffff',
    headerSubtext: 'rgba(255,255,255,0.5)',
    ctaBg: 'linear-gradient(135deg,#2563eb 0%,#4338ca 100%)',
    ctaText: '#ffffff',
    ctaRadius: '12px',
    badgeBg: 'linear-gradient(135deg,#ef4444,#dc2626)',
    badgeText: '#ffffff',
    discountBorderColor: '#f59e0b',
    discountInnerBg: 'linear-gradient(135deg,#fffbeb,#fef3c7)',
    discountTextMain: '#78350f',
    discountTextSub: '#92400e',
    bodyBg: '#ffffff',
    bodyText: '#475569',
    headlineColor: '#0f172a',
    footerBg: '#f8fafc',
    footerBorder: '#e2e8f0',
    footerText: '#94a3b8',
    footerLink: '#64748b',
    cardBg: '#f0f4ff',
    cardBorder: '#bfdbfe',
    cardText: '#0f172a',
    cardPriceBg: '#2563eb',
  },
}

export interface EmailData {
  storeName: string
  previewText: string
  headline: string
  body: string
  ctaText: string
  ctaUrl: string
  imageUrl?: string
  discountRate?: string
  unsubscribeUrl: string
  trackingPixelUrl: string
  layoutStyle?: LayoutStyle
  brandColor?: string
  products?: Product[]
}

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

function buildProductCardsHtml(products: Product[], theme: ThemeTokens, ctaUrl: string): string {
  if (!products || products.length === 0) return ''
  const shown = products.slice(0, 4)

  // For dark-card themes (gaming, black-friday), override card text colors
  const darkCard = theme.cardBg.startsWith('#0') || theme.cardBg.startsWith('#1')
  const nameColor = darkCard ? '#fff' : theme.cardText
  const subColor = darkCard ? 'rgba(255,255,255,0.55)' : '#888'

  function cardHtml(p: Product): string {
    const hasDiscount = p.compareAtPrice && p.compareAtPrice !== p.price
    return `
<td valign="top" style="width:48%;vertical-align:top">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${theme.cardBg};border:1px solid ${theme.cardBorder};border-radius:14px;overflow:hidden">
${p.productImage ? `<tr><td style="padding:0;line-height:0"><img src="${esc(p.productImage)}" width="100%" alt="${esc(p.productName)}" style="display:block;width:100%;height:auto;max-height:200px;object-fit:cover"/></td></tr>` : ''}
<tr><td style="padding:14px 16px">
<p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${nameColor};line-height:1.3">${esc(p.productName)}</p>
${p.description ? `<p style="margin:0 0 8px;font-size:11px;color:${subColor};line-height:1.4">${esc(p.description.slice(0, 60))}${p.description.length > 60 ? '…' : ''}</p>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td valign="middle">
${p.price ? `<span style="display:block;font-size:16px;font-weight:800;color:${nameColor}">${esc(p.price)} ₺</span>` : ''}
${hasDiscount ? `<span style="display:block;font-size:11px;color:${subColor};text-decoration:line-through">${esc(p.compareAtPrice!)} ₺</span>` : ''}
</td>
${p.productUrl ? `<td align="right" valign="middle"><a href="${esc(p.productUrl)}" style="display:inline-block;background:${theme.cardPriceBg};color:#fff;font-size:11px;font-weight:700;padding:7px 14px;border-radius:8px;text-decoration:none">İncele</a></td>` : ''}
</tr></table>
</td></tr>
</table>
</td>`
  }

  let rows = ''
  for (let i = 0; i < shown.length; i += 2) {
    const left = shown[i]
    const right = shown[i + 1]
    rows += `
<tr>
${cardHtml(left)}
<td style="width:4%"></td>
${right ? cardHtml(right) : '<td style="width:48%"></td>'}
</tr>
${i + 2 < shown.length ? '<tr><td colspan="3" style="height:12px"></td></tr>' : ''}
`
  }

  return `
<!-- PRODUCTS SECTION -->
<tr><td style="background:${theme.bodyBg};padding:0 28px 28px">
<p style="margin:0 0 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${theme.bodyText}">Öne Çıkan Ürünler</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
${rows}
</table>
</td></tr>`
}

export function buildEmailHtml(d: EmailData): string {
  const theme = THEMES[d.layoutStyle ?? 'default'] ?? THEMES.default
  const ctaBg = d.brandColor ? d.brandColor : theme.ctaBg
  const productCardsHtml = buildProductCardsHtml(d.products ?? [], theme, d.ctaUrl)

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(d.headline)}</title>
<style>
body{margin:0;padding:0;background:#f1f5f9}
@media only screen and (max-width:600px){
  .wrap{padding:12px 6px!important}
  .card{border-radius:16px!important}
  .ec{padding:28px 18px!important}
  .h1{font-size:22px!important;line-height:1.3!important}
  .cta-btn{padding:14px 28px!important;font-size:14px!important}
  .pcard-td{display:block!important;width:100%!important;padding-bottom:12px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-text-size-adjust:100%">

<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9">${esc(d.previewText)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="wrap" style="background:#f1f5f9;padding:40px 20px">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" class="card" style="max-width:600px;width:100%;background:${theme.bodyBg};border-radius:24px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.10)">

<!-- HEADER -->
<tr><td style="background:${theme.headerBg};padding:24px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td style="vertical-align:middle">
  <span style="color:${theme.headerText};font-size:19px;font-weight:800;letter-spacing:-0.3px">${esc(d.storeName)}</span>
</td>
${d.discountRate ? `<td align="right" style="vertical-align:middle">
  <span style="display:inline-block;background:${theme.badgeBg};color:${theme.badgeText};font-size:12px;font-weight:800;padding:5px 14px;border-radius:100px;letter-spacing:0.5px">%${esc(d.discountRate)} İNDİRİM</span>
</td>` : ''}
</tr></table>
</td></tr>

${d.imageUrl ? `<!-- HERO IMAGE -->
<tr><td style="padding:0;line-height:0"><img src="${esc(d.imageUrl)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:none;line-height:0"/></td></tr>` : ''}

<!-- CONTENT -->
<tr><td class="ec" style="background:${theme.bodyBg};padding:40px 36px 32px">
<h1 class="h1" style="margin:0 0 14px;font-size:28px;font-weight:800;color:${theme.headlineColor};line-height:1.2;letter-spacing:-0.5px">${esc(d.headline)}</h1>
<div style="font-size:15px;line-height:1.75;color:${theme.bodyText};margin-bottom:28px">${nl2br(d.body)}</div>

${d.discountRate ? `<!-- DISCOUNT BADGE -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
<tr><td style="background:${theme.discountInnerBg};border:2px dashed ${theme.discountBorderColor};border-radius:14px;padding:18px 24px;text-align:center">
<p style="margin:0;font-size:13px;color:${theme.discountTextSub};font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Özel Fırsat</p>
<p style="margin:6px 0 0;font-size:26px;font-weight:900;color:${theme.discountTextMain};letter-spacing:3px">%${esc(d.discountRate)} TASARRUF</p>
</td></tr></table>` : ''}

<!-- CTA BUTTON -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td align="center">
<a href="${esc(d.ctaUrl)}" class="cta-btn" style="display:inline-block;background:${ctaBg};color:${theme.ctaText};font-size:15px;font-weight:700;padding:16px 44px;border-radius:${theme.ctaRadius};text-decoration:none;letter-spacing:0.2px;mso-padding-alt:0">
  ${esc(d.ctaText)}
</a>
</td>
</tr></table>

</td></tr>

${productCardsHtml}

<!-- FOOTER -->
<tr><td style="background:${theme.footerBg};padding:20px 36px;border-top:1px solid ${theme.footerBorder}">
<p style="margin:0;font-size:11px;color:${theme.footerText};line-height:1.6">
${esc(d.storeName)} tarafından gönderildi.&nbsp;
<a href="${esc(d.unsubscribeUrl)}" style="color:${theme.footerLink};text-decoration:underline">Aboneliği iptal et</a>
</p>
</td></tr>

</table>
</td></tr></table>

<img src="${esc(d.trackingPixelUrl)}" width="1" height="1" alt="" style="display:none;visibility:hidden;opacity:0;width:1px;height:1px;border:0"/>
</body>
</html>`
}

export function personalize(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match)
}
