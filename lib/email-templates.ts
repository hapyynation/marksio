// Unlayer (react-email-editor) design builder

let _id = 1
const uid = (prefix: string) => `${prefix}_${_id++}`
const resetIds = () => { _id = 1 }

export interface TemplateContent {
  storeName?: string
  headline?: string
  subheadline?: string
  body?: string
  cta?: string
  ctaUrl?: string
}

// ─── Block helpers ───────────────────────────────────────────────────────────

function textBlock(html: string, opts: { padding?: string; align?: string } = {}) {
  const id = uid('u_content_text')
  return {
    id,
    type: 'text',
    values: {
      containerPadding: opts.padding ?? '12px 40px',
      anchor: '',
      fontSize: '14px',
      textAlign: opts.align ?? 'left',
      lineHeight: '150%',
      linkStyle: { inherit: true, linkColor: '#0068a5', linkHoverColor: '#0068a5', linkUnderline: true, linkHoverUnderline: true },
      hideDesktop: false,
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      text: html,
      _meta: { htmlID: id, htmlClassNames: 'u_content_text' },
    },
  }
}

function buttonBlock(label: string, href: string, opts: { bg?: string; color?: string; padding?: string; radius?: string } = {}) {
  const id = uid('u_content_button')
  return {
    id,
    type: 'button',
    values: {
      containerPadding: opts.padding ?? '8px 40px 32px',
      anchor: '',
      href: { name: 'web', values: { href, target: '_blank' } },
      buttonColors: {
        color: opts.color ?? '#FFFFFF',
        backgroundColor: opts.bg ?? '#2563EB',
        hoverColor: opts.color ?? '#FFFFFF',
        hoverBackgroundColor: opts.bg ?? '#1d4ed8',
      },
      size: { autoWidth: true, width: '100%' },
      textAlign: 'center',
      lineHeight: '120%',
      padding: '16px 48px',
      border: {},
      borderRadius: opts.radius ?? '8px',
      hideDesktop: false,
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      text: `<span style="font-size:16px;font-weight:700;">${label}</span>`,
      _meta: { htmlID: id, htmlClassNames: 'u_content_button' },
    },
  }
}

function dividerBlock(color = '#e5e7eb', padding = '8px 40px') {
  const id = uid('u_content_divider')
  return {
    id,
    type: 'divider',
    values: {
      containerPadding: padding,
      anchor: '',
      width: '100%',
      border: { borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: color },
      textAlign: 'center',
      hideDesktop: false,
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      _meta: { htmlID: id, htmlClassNames: 'u_content_divider' },
    },
  }
}

function makeColumn(contents: any[], opts: { bg?: string; padding?: string } = {}) {
  const id = uid('u_column')
  return {
    id,
    contents,
    values: {
      backgroundColor: opts.bg ?? '',
      padding: opts.padding ?? '0px',
      border: {},
      borderRadius: '0px',
      _meta: { htmlID: id, htmlClassNames: 'u_column' },
    },
  }
}

function makeRow(columns: any[], opts: { bg?: string; colsBg?: string; padding?: string } = {}) {
  const id = uid('u_row')
  return {
    id,
    cells: columns.map(() => 1),
    columns,
    values: {
      displayCondition: null,
      columns: false,
      backgroundColor: opts.bg ?? '',
      columnsBackgroundColor: opts.colsBg ?? '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'custom', position: 'center', customPosition: ['50%', '50%'] },
      padding: opts.padding ?? '0px',
      anchor: '',
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      _meta: { htmlID: id, htmlClassNames: 'u_row' },
    },
  }
}

function makeBodyValues(opts: { bg?: string; linkColor?: string } = {}) {
  return {
    popupPosition: 'center', popupWidth: '600px', popupHeight: 'auto', borderRadius: '10px',
    contentAlign: 'center', contentVerticalAlign: 'center', contentWidth: '600',
    fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif', url: '', defaultFont: true, weights: null },
    textColor: '#000000',
    popupBackgroundColor: '#FFFFFF',
    popupBackgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'custom', position: 'center' },
    popupOverlay_backgroundColor: 'rgba(0,0,0,0.1)',
    popupCloseButton_margin: '0px', popupCloseButton_position: 'top-right',
    popupCloseButton_backgroundColor: '#DDDDDD', popupCloseButton_iconColor: '#000000',
    popupCloseButton_borderRadius: '0px', popupCloseButton_style: 'fixed',
    backgroundColor: opts.bg ?? '#f4f4f4',
    backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'custom', position: 'center', customPosition: ['50%', '50%'] },
    preheaderText: '',
    linkStyle: { body: true, linkColor: opts.linkColor ?? '#2563EB', linkHoverColor: opts.linkColor ?? '#2563EB', linkUnderline: true, linkHoverUnderline: true, inherit: false },
    _meta: { htmlID: 'u_body', htmlClassNames: 'u_body' },
  }
}

function footerRow(storeName: string, linkColor: string) {
  return makeRow([
    makeColumn([
      dividerBlock('#e5e7eb', '4px 40px'),
      textBlock(
        `<p style="font-size:12px;color:#9ca3af;margin:0;line-height:1.6;text-align:center;">© 2025 ${storeName}. Tüm hakları saklıdır.<br/>Bu emaili almak istemiyorsanız <a href="{{unsubscribe}}" style="color:${linkColor};">aboneliği iptal edebilirsiniz</a>.</p>`,
        { padding: '4px 40px 24px', align: 'center' }
      ),
    ]),
  ], { bg: '#f9fafb' })
}

// ─── Template 1: Promosyon ────────────────────────────────────────────────────

export function buildPromoTemplate(c: TemplateContent) {
  resetIds()
  const store = c.storeName ?? 'Mağazamız'
  return {
    body: {
      rows: [
        makeRow([makeColumn([
          textBlock(`<p style="font-size:22px;font-weight:700;color:#fff;margin:0;text-align:center;">${store}</p>`, { padding: '22px 40px', align: 'center' }),
        ])], { bg: '#1e3a8a' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:40px;font-weight:800;color:#fff;margin:0 0 10px;line-height:1.15;text-align:center;">${c.headline ?? 'Özel Teklifiniz Sizi Bekliyor!'}</p><p style="font-size:17px;color:#bfdbfe;margin:0;text-align:center;">${c.subheadline ?? 'Sınırlı süre için geçerli'}</p>`, { padding: '52px 40px 36px', align: 'center' }),
        ])], { bg: '#2563EB' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:16px;color:#374151;line-height:1.75;margin:0;">${c.body ?? 'Değerli müşterimiz, sizin için hazırladığımız özel fırsatı kaçırmayın.'}</p>`, { padding: '40px 40px 8px' }),
        ])], { bg: '#ffffff' }),
        makeRow([makeColumn([
          buttonBlock(c.cta ?? 'Hemen Alışveriş Yap', c.ctaUrl ?? '#', { bg: '#2563EB', color: '#fff' }),
        ])], { bg: '#ffffff' }),
        footerRow(store, '#2563EB'),
      ],
      values: makeBodyValues({ bg: '#eff6ff', linkColor: '#2563EB' }),
    },
  }
}

// ─── Template 2: Hoş Geldiniz ─────────────────────────────────────────────────

export function buildWelcomeTemplate(c: TemplateContent) {
  resetIds()
  const store = c.storeName ?? 'Mağazamız'
  return {
    body: {
      rows: [
        makeRow([makeColumn([
          textBlock(`<p style="font-size:22px;font-weight:700;color:#fff;margin:0;text-align:center;">${store}</p>`, { padding: '22px 40px', align: 'center' }),
        ])], { bg: '#065f46' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:48px;margin:0;text-align:center;">🎉</p>`, { padding: '40px 40px 12px', align: 'center' }),
          textBlock(`<p style="font-size:34px;font-weight:800;color:#065f46;margin:0 0 10px;line-height:1.2;text-align:center;">${c.headline ?? `${store} Ailesine Hoş Geldiniz!`}</p><p style="font-size:16px;color:#6b7280;margin:0;text-align:center;">${c.subheadline ?? 'İlk alışverişinizde özel sürpriz sizi bekliyor'}</p>`, { padding: '0 40px 36px', align: 'center' }),
        ])], { bg: '#f0fdf4' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:16px;color:#374151;line-height:1.75;margin:0;">${c.body ?? 'Bize katıldığınız için çok mutluyuz!'}</p>`, { padding: '36px 40px 8px' }),
        ])], { bg: '#ffffff' }),
        makeRow([makeColumn([
          buttonBlock(c.cta ?? 'Alışverişe Başla', c.ctaUrl ?? '#', { bg: '#059669', color: '#fff' }),
        ])], { bg: '#ffffff' }),
        footerRow(store, '#059669'),
      ],
      values: makeBodyValues({ bg: '#f0fdf4', linkColor: '#059669' }),
    },
  }
}

// ─── Template 3: Geri Kazanım ─────────────────────────────────────────────────

export function buildWinbackTemplate(c: TemplateContent) {
  resetIds()
  const store = c.storeName ?? 'Mağazamız'
  return {
    body: {
      rows: [
        makeRow([makeColumn([
          textBlock(`<p style="font-size:22px;font-weight:700;color:#fff;margin:0;text-align:center;">${store}</p>`, { padding: '22px 40px', align: 'center' }),
        ])], { bg: '#92400e' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:48px;margin:0;text-align:center;">💛</p>`, { padding: '40px 40px 12px', align: 'center' }),
          textBlock(`<p style="font-size:36px;font-weight:800;color:#fff;margin:0 0 10px;line-height:1.2;text-align:center;">${c.headline ?? 'Sizi Çok Özledik!'}</p><p style="font-size:16px;color:#fde68a;margin:0;text-align:center;">${c.subheadline ?? 'Geri dönmeniz için özel bir teklifimiz var'}</p>`, { padding: '0 40px 36px', align: 'center' }),
        ])], { bg: '#d97706' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:16px;color:#374151;line-height:1.75;margin:0;">${c.body ?? 'Bir süredir göremiyoruz. Sizi geri ağırlamak için özel bir sürpriz hazırladık.'}</p>`, { padding: '36px 40px 8px' }),
        ])], { bg: '#ffffff' }),
        makeRow([makeColumn([
          buttonBlock(c.cta ?? 'Teklife Bak', c.ctaUrl ?? '#', { bg: '#d97706', color: '#fff' }),
        ])], { bg: '#ffffff' }),
        footerRow(store, '#d97706'),
      ],
      values: makeBodyValues({ bg: '#fffbeb', linkColor: '#d97706' }),
    },
  }
}

// ─── Template 4: VIP Özel ─────────────────────────────────────────────────────

export function buildVipTemplate(c: TemplateContent) {
  resetIds()
  const store = c.storeName ?? 'Mağazamız'
  return {
    body: {
      rows: [
        makeRow([makeColumn([
          textBlock(`<p style="font-size:11px;font-weight:700;color:#f59e0b;margin:0 0 4px;letter-spacing:3px;text-align:center;">✦ ÖZEL DAVET ✦</p><p style="font-size:22px;font-weight:700;color:#fff;margin:0;text-align:center;">${store}</p>`, { padding: '24px 40px', align: 'center' }),
        ])], { bg: '#0f0f0f' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:38px;font-weight:800;color:#fff;margin:0 0 12px;line-height:1.15;text-align:center;">${c.headline ?? 'Yalnızca VIP Üyelerimize Özel'}</p><p style="font-size:15px;color:#fbbf24;margin:0;letter-spacing:1px;text-align:center;">${c.subheadline ?? 'Sınırlı sayıda — önce siz alın'}</p>`, { padding: '52px 40px 24px', align: 'center' }),
          dividerBlock('#f59e0b', '0 80px 32px'),
        ])], { bg: '#1a1a1a' }),
        makeRow([makeColumn([
          textBlock(`<p style="font-size:16px;color:#d1d5db;line-height:1.75;margin:0;">${c.body ?? 'Sizin için ayırdığımız bu özel teklif yalnızca seçkin müşterilerimize sunulmaktadır.'}</p>`, { padding: '36px 40px 8px' }),
        ])], { bg: '#111111' }),
        makeRow([makeColumn([
          buttonBlock(c.cta ?? 'VIP Ayrıcalığımı Kullan', c.ctaUrl ?? '#', { bg: '#f59e0b', color: '#0f0f0f', radius: '4px' }),
        ])], { bg: '#111111' }),
        makeRow([makeColumn([
          dividerBlock('#2a2a2a', '4px 40px'),
          textBlock(`<p style="font-size:12px;color:#6b7280;margin:0;line-height:1.6;text-align:center;">© 2025 ${store}. Tüm hakları saklıdır.<br/><a href="{{unsubscribe}}" style="color:#6b7280;">Aboneliği iptal et</a></p>`, { padding: '4px 40px 24px', align: 'center' }),
        ])], { bg: '#0f0f0f' }),
      ],
      values: makeBodyValues({ bg: '#1a1a1a', linkColor: '#f59e0b' }),
    },
  }
}

// ─── Template registry ────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES = [
  {
    id: 'promo' as const,
    name: 'Promosyon',
    desc: 'İndirim & kampanya için',
    accent: '#2563EB',
    headerBg: '#2563EB',
    headerText: '#fff',
    build: buildPromoTemplate,
  },
  {
    id: 'welcome' as const,
    name: 'Hoş Geldiniz',
    desc: 'Yeni müşteri karşılama',
    accent: '#059669',
    headerBg: '#059669',
    headerText: '#fff',
    build: buildWelcomeTemplate,
  },
  {
    id: 'winback' as const,
    name: 'Geri Kazanım',
    desc: 'Pasif müşteriyi geri çek',
    accent: '#d97706',
    headerBg: '#d97706',
    headerText: '#fff',
    build: buildWinbackTemplate,
  },
  {
    id: 'vip' as const,
    name: 'VIP Özel',
    desc: 'Premium üye ayrıcalığı',
    accent: '#f59e0b',
    headerBg: '#1a1a1a',
    headerText: '#f59e0b',
    build: buildVipTemplate,
  },
]

export type TemplateId = typeof EMAIL_TEMPLATES[number]['id']
