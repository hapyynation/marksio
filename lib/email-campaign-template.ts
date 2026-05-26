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
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

export function buildEmailHtml(d: EmailData): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(d.headline)}</title>
<style>
@media only screen and (max-width:600px){
  .wrap{padding:16px 8px!important}
  .card{border-radius:16px!important}
  .ec{padding:28px 20px!important}
  .h1{font-size:22px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#f1f5f9">${esc(d.previewText)} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" class="wrap" style="background:#f1f5f9;padding:40px 20px">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" width="600" class="card" style="max-width:600px;width:100%;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08)">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:22px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
<td><span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.3px">${esc(d.storeName)}</span></td>
${d.discountRate ? `<td align="right"><span style="display:inline-block;background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;font-size:12px;font-weight:800;padding:5px 14px;border-radius:100px;letter-spacing:0.5px">%${esc(d.discountRate)} İNDİRİM</span></td>` : ''}
</tr></table>
</td></tr>

${d.imageUrl ? `<!-- Hero -->
<tr><td style="padding:0;line-height:0"><img src="${esc(d.imageUrl)}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:none"/></td></tr>` : ''}

<!-- Content -->
<tr><td class="ec" style="padding:40px 36px 32px">
<h1 class="h1" style="margin:0 0 14px;font-size:28px;font-weight:800;color:#0f172a;line-height:1.2;letter-spacing:-0.5px">${esc(d.headline)}</h1>
<div style="font-size:15px;line-height:1.75;color:#475569;margin-bottom:28px">${nl2br(d.body)}</div>

${d.discountRate ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px">
<tr><td style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:2px dashed #f59e0b;border-radius:14px;padding:18px 24px;text-align:center">
<p style="margin:0;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Özel Fırsat</p>
<p style="margin:6px 0 0;font-size:26px;font-weight:900;color:#78350f;letter-spacing:3px">%${esc(d.discountRate)} TASARRUF</p>
</td></tr></table>` : ''}

<table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td align="center">
<a href="${esc(d.ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#2563eb 0%,#4338ca 100%);color:#fff;font-size:15px;font-weight:700;padding:16px 44px;border-radius:12px;text-decoration:none;letter-spacing:0.2px;box-shadow:0 4px 16px rgba(37,99,235,0.3)">${esc(d.ctaText)}</a>
</td></tr></table>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0">
<p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6">${esc(d.storeName)} tarafından gönderildi. Bu e-postayı almak istemiyorsanız <a href="${esc(d.unsubscribeUrl)}" style="color:#64748b;text-decoration:underline">aboneliğinizi iptal edebilirsiniz</a>.</p>
</td></tr>

</table>
</td></tr></table>
<img src="${esc(d.trackingPixelUrl)}" width="1" height="1" alt="" style="display:none"/>
</body>
</html>`
}
