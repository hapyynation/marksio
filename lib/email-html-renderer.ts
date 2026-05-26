/**
 * Converts Block[] into proper email HTML.
 * Output is table-based, inline-styled — works in Gmail, Outlook, Apple Mail.
 */

export interface Block {
  id: string
  type: 'hero' | 'text' | 'cta' | 'product' | 'coupon' | 'benefits'
      | 'feature_cards' | 'trust_bar' | 'divider' | 'footer' | 'image'
      | 'testimonial' | 'countdown' | 'discount_section'
  c: Record<string, string>
}

interface RenderOptions {
  storeName?: string
  trackingPixelUrl?: string
  unsubscribeUrl?: string
  ctaBaseUrl?: string
  accentColor?: string
}

function esc(str: string): string {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function heroRow(c: Record<string, string>, accent: string): string {
  const bg = c.bgColor || '#0a1628'
  const badge = c.badge ? `
    <tr><td align="center" style="padding-bottom:12px">
      <span style="display:inline-block;padding:5px 14px;border-radius:100px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);font-size:11px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:1px;text-transform:uppercase">${esc(c.badge)}</span>
    </td></tr>` : ''
  const imageHtml = c.imageUrl ? `
    <tr><td align="center" style="padding-bottom:20px">
      <img src="${esc(c.imageUrl)}" width="520" style="max-width:100%;border-radius:12px;display:block" alt="">
    </td></tr>` : ''
  return `
  <tr><td style="background:${esc(bg)};padding:56px 32px;text-align:center">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      ${badge}
      ${imageHtml}
      <tr><td align="center">
        <h1 style="margin:0 0 12px;font-size:34px;font-weight:900;color:#ffffff;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${esc(c.headline || 'Kampanya Başlığı')}</h1>
      </td></tr>
      <tr><td align="center">
        <p style="margin:0;font-size:17px;color:rgba(255,255,255,0.65);line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${esc(c.sub || '')}</p>
      </td></tr>
    </table>
  </td></tr>`
}

function textRow(c: Record<string, string>): string {
  const lines = (c.body || '').split('\n').map(l => esc(l)).join('<br>')
  return `
  <tr><td style="padding:28px 36px">
    <p style="margin:0;font-size:15px;color:#374151;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${lines}</p>
  </td></tr>`
}

function ctaRow(c: Record<string, string>, accent: string, ctaBase: string): string {
  const color = c.color || accent
  const url = c.url || ctaBase || '#'
  const sub = c.sub ? `<p style="margin:10px 0 0;font-size:12px;color:#9ca3af;font-family:-apple-system,sans-serif">${esc(c.sub)}</p>` : ''
  return `
  <tr><td style="padding:24px 36px;text-align:center">
    <a href="${esc(url)}" style="display:inline-block;padding:16px 40px;background:${esc(color)};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.15)">${esc(c.label || 'Hemen İncele')}</a>
    ${sub}
  </td></tr>`
}

function productRow(c: Record<string, string>, accent: string): string {
  const imgHtml = c.imageUrl
    ? `<img src="${esc(c.imageUrl)}" width="80" height="80" style="border-radius:10px;object-fit:cover;display:block" alt="${esc(c.name || '')}">`
    : `<div style="width:80px;height:80px;background:#f3f4f6;border-radius:10px;border:1px solid #e5e7eb"></div>`
  const oldPrice = c.oldPrice ? `<span style="font-size:13px;color:#9ca3af;text-decoration:line-through;margin-left:8px">${esc(c.oldPrice)}</span>` : ''
  return `
  <tr><td style="padding:12px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #f0f0f0;border-radius:14px;overflow:hidden">
      <tr>
        <td width="96" style="padding:16px;vertical-align:top">${imgHtml}</td>
        <td style="padding:16px 16px 16px 0;vertical-align:top">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;font-family:-apple-system,sans-serif">${esc(c.name || 'Ürün Adı')}</p>
          <p style="margin:0 0 10px;font-size:13px;color:#6b7280;line-height:1.5;font-family:-apple-system,sans-serif">${esc(c.desc || '')}</p>
          <p style="margin:0;font-size:20px;font-weight:900;color:${esc(accent)};font-family:-apple-system,sans-serif">${esc(c.price || '')}${oldPrice}</p>
        </td>
      </tr>
    </table>
  </td></tr>`
}

function couponRow(c: Record<string, string>): string {
  const expiry = c.expiry ? `<p style="margin:10px 0 0;font-size:12px;color:#6b7280;font-family:-apple-system,sans-serif">${esc(c.expiry)}</p>` : ''
  return `
  <tr><td style="padding:12px 28px">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px dashed #3b82f6;border-radius:14px;background:#eff6ff">
      <tr><td style="padding:32px;text-align:center">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:2px;font-family:-apple-system,sans-serif">İndirim Kodu</p>
        <p style="margin:0 0 6px;font-size:32px;font-weight:900;color:#111827;letter-spacing:6px;font-family:'Courier New',Courier,monospace">${esc(c.code || 'SAVE20')}</p>
        <p style="margin:0;font-size:15px;font-weight:600;color:#2563eb;font-family:-apple-system,sans-serif">${esc(c.discount || '')}</p>
        ${expiry}
      </td></tr>
    </table>
  </td></tr>`
}

function benefitsRow(c: Record<string, string>): string {
  const items = (c.items || 'Ücretsiz kargo\nKolay iade\nGüvenli ödeme').split('\n').filter(Boolean)
  const rows = items.map(item => `
    <tr>
      <td width="20" style="vertical-align:top;padding-top:2px;color:#10b981;font-size:16px;font-weight:700">✓</td>
      <td style="padding-left:10px;font-size:14px;color:#374151;font-weight:500;font-family:-apple-system,sans-serif;padding-bottom:10px">${esc(item.replace(/^[✓✗·\-*]\s?/, ''))}</td>
    </tr>`).join('')
  return `
  <tr><td style="padding:16px 36px">
    <table cellpadding="0" cellspacing="0" border="0">${rows}</table>
  </td></tr>`
}

function featureCardsRow(c: Record<string, string>): string {
  const cards = [1, 2, 3].map(i => ({
    icon: c[`card${i}_icon`] || '',
    title: c[`card${i}_title`] || '',
    desc: c[`card${i}_desc`] || '',
  })).filter(card => card.title)
  if (!cards.length) return ''
  const width = Math.floor(100 / cards.length)
  const cellHtml = cards.map(card => `
    <td width="${width}%" style="padding:0 12px;vertical-align:top;text-align:center">
      <div style="background:#f9fafb;border:1px solid #f0f0f0;border-radius:14px;padding:24px 16px">
        <p style="font-size:28px;margin:0 0 10px;line-height:1">${esc(card.icon)}</p>
        <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 6px;font-family:-apple-system,sans-serif">${esc(card.title)}</p>
        <p style="font-size:12px;color:#6b7280;margin:0;line-height:1.6;font-family:-apple-system,sans-serif">${esc(card.desc)}</p>
      </div>
    </td>`).join('')
  const title = c.title ? `<tr><td align="center" style="padding-bottom:16px"><p style="margin:0;font-size:16px;font-weight:700;color:#111827;font-family:-apple-system,sans-serif">${esc(c.title)}</p></td></tr>` : ''
  return `
  <tr><td style="padding:24px 28px">
    ${title ? `<table width="100%" cellpadding="0" cellspacing="0" border="0">${title}</table>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>${cellHtml}</tr>
    </table>
  </td></tr>`
}

function trustBarRow(c: Record<string, string>): string {
  const items = [1, 2, 3, 4].map(i => ({
    icon: c[`item${i}_icon`] || '',
    text: c[`item${i}_text`] || '',
  })).filter(item => item.text)
  if (!items.length) return ''
  const width = Math.floor(100 / items.length)
  const cells = items.map(item => `
    <td width="${width}%" style="padding:0 8px;text-align:center;vertical-align:middle">
      <p style="font-size:22px;margin:0 0 5px;line-height:1">${esc(item.icon)}</p>
      <p style="font-size:11px;font-weight:600;color:#6b7280;margin:0;font-family:-apple-system,sans-serif;letter-spacing:0.3px">${esc(item.text)}</p>
    </td>`).join('')
  return `
  <tr><td style="padding:18px 28px;background:#f9fafb;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>${cells}</tr>
    </table>
  </td></tr>`
}

function imageRow(c: Record<string, string>): string {
  if (!c.src) return ''
  return `
  <tr><td style="padding:12px 28px">
    <img src="${esc(c.src)}" width="544" style="max-width:100%;border-radius:14px;display:block" alt="${esc(c.alt || '')}">
  </td></tr>`
}

function testimonialRow(c: Record<string, string>): string {
  const stars = Math.min(5, Math.max(1, parseInt(c.stars || '5')))
  const starsHtml = '★'.repeat(stars) + '☆'.repeat(5 - stars)
  const initials = (c.name || '?')[0]?.toUpperCase() || '?'
  const avatar = c.avatar
    ? `<img src="${esc(c.avatar)}" width="44" height="44" style="border-radius:50%;object-fit:cover;display:block" alt="${esc(c.name || '')}">`
    : `<div style="width:44px;height:44px;border-radius:50%;background:#e5e7eb;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#6b7280;line-height:44px;text-align:center">${esc(initials)}</div>`
  return `
  <tr><td style="padding:16px 36px">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border-radius:16px;border:1px solid #f0f0f0">
      <tr><td style="padding:24px">
        <p style="margin:0 0 10px;font-size:17px;color:#f59e0b;letter-spacing:3px">${starsHtml}</p>
        <p style="margin:0 0 16px;font-size:14px;font-style:italic;color:#374151;line-height:1.75;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">"${esc(c.quote || 'Harika bir ürün ve müşteri hizmetleri!')}"</p>
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="vertical-align:middle">${avatar}</td>
            <td style="padding-left:12px;vertical-align:middle">
              <p style="margin:0;font-size:13px;font-weight:700;color:#111827;font-family:-apple-system,sans-serif">${esc(c.name || 'Müşteri Adı')}</p>
              ${c.role ? `<p style="margin:2px 0 0;font-size:11px;color:#9ca3af;font-family:-apple-system,sans-serif">${esc(c.role)}</p>` : ''}
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </td></tr>`
}

function countdownRow(c: Record<string, string>, accent: string): string {
  const items = [
    { value: c.days    || '03', label: 'Gün'    },
    { value: c.hours   || '12', label: 'Saat'   },
    { value: c.minutes || '45', label: 'Dakika' },
    { value: c.seconds || '00', label: 'Saniye' },
  ]
  const boxes = items.map(item => `
    <td style="text-align:center;padding:0 5px;vertical-align:top">
      <div style="background:${esc(accent)};border-radius:10px;padding:12px 8px;min-width:54px;display:inline-block">
        <p style="margin:0;font-size:26px;font-weight:900;color:#ffffff;font-family:'Courier New',Courier,monospace;line-height:1">${esc(item.value)}</p>
        <p style="margin:4px 0 0;font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:1.5px;font-family:-apple-system,sans-serif">${esc(item.label)}</p>
      </div>
    </td>`).join('')
  return `
  <tr><td style="padding:24px 36px;text-align:center">
    ${c.label ? `<p style="margin:0 0 18px;font-size:15px;font-weight:700;color:#111827;font-family:-apple-system,BlinkMacSystemFont,sans-serif">${esc(c.label)}</p>` : ''}
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
      <tr>${boxes}</tr>
    </table>
    ${c.sub ? `<p style="margin:14px 0 0;font-size:12px;color:#6b7280;font-family:-apple-system,sans-serif">${esc(c.sub)}</p>` : ''}
  </td></tr>`
}

function discountSectionRow(c: Record<string, string>, accent: string): string {
  const bg = c.bgColor || accent
  return `
  <tr><td>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${esc(bg)}">
      <tr><td style="padding:40px 36px;text-align:center">
        ${c.label ? `<p style="margin:0 0 8px;font-size:10px;font-weight:800;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:4px;font-family:-apple-system,sans-serif">${esc(c.label)}</p>` : ''}
        <p style="margin:0 0 8px;font-size:54px;font-weight:900;color:#ffffff;line-height:1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">${esc(c.discountText || '%40')}</p>
        <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.85);font-family:-apple-system,BlinkMacSystemFont,sans-serif">${esc(c.sub || 'Tüm ürünlerde indirim')}</p>
      </td></tr>
    </table>
  </td></tr>`
}

function dividerRow(): string {
  return `
  <tr><td style="padding:6px 36px">
    <div style="height:1px;background:#f0f0f0;line-height:1px;font-size:1px">&nbsp;</div>
  </td></tr>`
}

function footerRow(c: Record<string, string>, unsubUrl: string): string {
  return `
  <tr><td style="padding:28px 36px;text-align:center;border-top:1px solid #f9fafb;background:#fafafa">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#9ca3af;font-family:-apple-system,sans-serif">${esc(c.brand || 'Markly')}</p>
    <p style="margin:0 0 10px;font-size:11px;color:#d1d5db;font-family:-apple-system,sans-serif">${esc(c.addr || 'İstanbul, Türkiye')}</p>
    <a href="${esc(unsubUrl || '#')}" style="font-size:11px;color:#9ca3af;text-decoration:underline;font-family:-apple-system,sans-serif">Aboneliği iptal et</a>
  </td></tr>`
}

export function renderBlocksToEmailHtml(blocks: Block[], opts: RenderOptions = {}): string {
  const accent = opts.accentColor || '#2563eb'
  const ctaBase = opts.ctaBaseUrl || '#'
  const unsubUrl = opts.unsubscribeUrl || '#'
  const trackingPixel = opts.trackingPixelUrl
    ? `<img src="${opts.trackingPixelUrl}" width="1" height="1" style="display:none" alt="">`
    : ''

  const rows = blocks.map(block => {
    switch (block.type) {
      case 'hero':          return heroRow(block.c, accent)
      case 'text':          return textRow(block.c)
      case 'cta':           return ctaRow(block.c, accent, ctaBase)
      case 'product':       return productRow(block.c, accent)
      case 'coupon':        return couponRow(block.c)
      case 'benefits':      return benefitsRow(block.c)
      case 'feature_cards': return featureCardsRow(block.c)
      case 'trust_bar':        return trustBarRow(block.c)
      case 'testimonial':      return testimonialRow(block.c)
      case 'countdown':        return countdownRow(block.c, accent)
      case 'discount_section': return discountSectionRow(block.c, accent)
      case 'divider':          return dividerRow()
      case 'image':            return imageRow(block.c)
      case 'footer':           return footerRow(block.c, unsubUrl)
      default:              return ''
    }
  }).join('')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${esc(opts.storeName || 'Kampanya')}</title>
</head>
<body style="margin:0;padding:0;background:#f0f2f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f2f5">
<tr><td align="center" style="padding:32px 12px">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.07)">
${rows}
</table>
${trackingPixel}
</td></tr>
</table>
</body>
</html>`
}

export function extractTextFromBlocks(blocks: Block[]): string {
  return blocks
    .map(b => {
      switch (b.type) {
        case 'hero':  return [b.c.headline, b.c.sub].filter(Boolean).join('\n')
        case 'text':  return b.c.body || ''
        case 'cta':   return b.c.label || ''
        default:      return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}
