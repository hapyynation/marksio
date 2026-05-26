// Unlayer design JSONs for preset email templates
// Each design is loaded into react-email-editor

export interface UnlayerDesign {
  counters: Record<string, number>
  body: {
    id: string
    rows: UnlayerRow[]
    values: Record<string, unknown>
  }
}

interface UnlayerRow {
  id: string
  cells: number[]
  columns: UnlayerColumn[]
  values: Record<string, unknown>
}

interface UnlayerColumn {
  id: string
  contents: UnlayerContent[]
  values: Record<string, unknown>
}

interface UnlayerContent {
  id: string
  type: string
  values: Record<string, unknown>
}

const baseValues = {
  backgroundColor: '#f4f4f8',
  backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'custom', position: 'center' },
  contentWidth: '600px',
  contentAlign: 'center',
  fontFamily: { label: 'Arial', value: 'arial,helvetica,sans-serif' },
  preheaderText: '',
  linkStyle: { body: true, linkColor: '#3b82f6', linkHoverColor: '#2563eb', linkUnderline: true, linkHoverUnderline: true },
}

function makeId() {
  return Math.random().toString(36).slice(2, 10)
}

function heroRow(opts: {
  bgColor: string
  badge?: string
  headline: string
  subline: string
  accentColor: string
}): UnlayerRow {
  const contents: UnlayerContent[] = []

  if (opts.badge) {
    contents.push({
      id: makeId(),
      type: 'text',
      values: {
        containerPadding: '20px 40px 0',
        textAlign: 'center',
        lineHeight: '140%',
        linkStyle: { inherit: true, linkUnderline: true, linkColor: '', linkHoverColor: '' },
        _meta: { htmlID: 'u_content_text_badge', htmlClassNames: 'u_content_text' },
        selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
        text: `<div style="text-align: center;"><span style="display:inline-block; padding: 5px 16px; border-radius: 100px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.75); letter-spacing: 1.5px; text-transform: uppercase;">${opts.badge}</span></div>`,
      },
    })
  }

  contents.push({
    id: makeId(),
    type: 'text',
    values: {
      containerPadding: opts.badge ? '16px 40px 8px' : '40px 40px 8px',
      textAlign: 'center',
      lineHeight: '130%',
      _meta: { htmlID: 'u_content_headline', htmlClassNames: 'u_content_text' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      text: `<h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #ffffff; line-height: 1.25;">${opts.headline}</h1>`,
    },
  })

  contents.push({
    id: makeId(),
    type: 'text',
    values: {
      containerPadding: '8px 40px 32px',
      textAlign: 'center',
      lineHeight: '160%',
      _meta: { htmlID: 'u_content_subline', htmlClassNames: 'u_content_text' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      text: `<p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.65);">${opts.subline}</p>`,
    },
  })

  return {
    id: makeId(),
    cells: [1],
    columns: [{
      id: makeId(),
      contents,
      values: { backgroundColor: '', padding: '0', border: {}, borderRadius: '0', _meta: { htmlID: 'u_column_hero', htmlClassNames: 'u_column' } },
    }],
    values: {
      displayCondition: null,
      columns: false,
      backgroundColor: opts.bgColor,
      columnsBackgroundColor: '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
      padding: '0',
      anchor: '',
      hideDesktop: false,
      _meta: { htmlID: 'u_row_hero', htmlClassNames: 'u_row' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    },
  }
}

function textRow(body: string, bgColor = '#ffffff'): UnlayerRow {
  return {
    id: makeId(),
    cells: [1],
    columns: [{
      id: makeId(),
      contents: [{
        id: makeId(),
        type: 'text',
        values: {
          containerPadding: '28px 40px',
          textAlign: 'left',
          lineHeight: '180%',
          _meta: { htmlID: `u_content_text_${makeId()}`, htmlClassNames: 'u_content_text' },
          selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
          text: `<p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.8;">${body.replace(/\n/g, '<br>')}</p>`,
        },
      }],
      values: { backgroundColor: '', padding: '0', border: {}, _meta: { htmlID: `u_column_${makeId()}`, htmlClassNames: 'u_column' } },
    }],
    values: {
      displayCondition: null, columns: false,
      backgroundColor: bgColor, columnsBackgroundColor: '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
      padding: '0', anchor: '', _meta: { htmlID: `u_row_${makeId()}`, htmlClassNames: 'u_row' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    },
  }
}

function buttonRow(label: string, accentColor: string, subtext?: string): UnlayerRow {
  const contents: UnlayerContent[] = [{
    id: makeId(),
    type: 'button',
    values: {
      containerPadding: '20px 40px 8px',
      anchor: '',
      href: { name: 'web', values: { href: '{{cta_url}}', target: '_blank' } },
      buttonColors: { color: '#ffffff', backgroundColor: accentColor, hoverColor: '#ffffff', hoverBackgroundColor: accentColor },
      size: { autoWidth: true, width: '100%' },
      textAlign: 'center',
      lineHeight: '120%',
      padding: '14px 36px',
      border: {},
      borderRadius: '12px',
      hideDesktop: false,
      _meta: { htmlID: `u_content_button_${makeId()}`, htmlClassNames: 'u_content_button' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
      text: `<strong><span style="font-size: 15px;">${label}</span></strong>`,
      calculatedWidth: 200, calculatedHeight: 50,
    },
  }]

  if (subtext) {
    contents.push({
      id: makeId(),
      type: 'text',
      values: {
        containerPadding: '4px 40px 24px',
        textAlign: 'center',
        lineHeight: '140%',
        _meta: { htmlID: `u_content_subtext_${makeId()}`, htmlClassNames: 'u_content_text' },
        selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
        text: `<p style="margin: 0; font-size: 11px; color: #9ca3af;">${subtext}</p>`,
      },
    })
  }

  return {
    id: makeId(),
    cells: [1],
    columns: [{
      id: makeId(),
      contents,
      values: { backgroundColor: '', padding: '0', border: {}, _meta: { htmlID: `u_column_${makeId()}`, htmlClassNames: 'u_column' } },
    }],
    values: {
      displayCondition: null, columns: false,
      backgroundColor: '#ffffff', columnsBackgroundColor: '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
      padding: '0', anchor: '', _meta: { htmlID: `u_row_${makeId()}`, htmlClassNames: 'u_row' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    },
  }
}

function couponRow(code: string, discount: string, expiry?: string): UnlayerRow {
  return {
    id: makeId(),
    cells: [1],
    columns: [{
      id: makeId(),
      contents: [{
        id: makeId(),
        type: 'text',
        values: {
          containerPadding: '12px 32px',
          textAlign: 'center',
          lineHeight: '150%',
          _meta: { htmlID: `u_content_coupon_${makeId()}`, htmlClassNames: 'u_content_text' },
          selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
          text: `<div style="border: 2px dashed #3b82f6; border-radius: 12px; background: #eff6ff; padding: 28px; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 2px;">İndirim Kodunuz</p>
            <p style="margin: 0 0 4px; font-size: 32px; font-weight: 900; color: #111827; letter-spacing: 6px; font-family: Courier, monospace;">${code}</p>
            <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2563eb;">${discount}</p>
            ${expiry ? `<p style="margin: 8px 0 0; font-size: 11px; color: #6b7280;">${expiry}</p>` : ''}
          </div>`,
        },
      }],
      values: { backgroundColor: '', padding: '0', border: {}, _meta: { htmlID: `u_column_${makeId()}`, htmlClassNames: 'u_column' } },
    }],
    values: {
      displayCondition: null, columns: false,
      backgroundColor: '#ffffff', columnsBackgroundColor: '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
      padding: '0', anchor: '', _meta: { htmlID: `u_row_${makeId()}`, htmlClassNames: 'u_row' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    },
  }
}

function dividerRow(): UnlayerRow {
  return {
    id: makeId(),
    cells: [1],
    columns: [{
      id: makeId(),
      contents: [{
        id: makeId(),
        type: 'divider',
        values: {
          width: '100%', border: { borderTopWidth: '1px', borderTopStyle: 'solid', borderTopColor: '#f3f4f6' },
          textAlign: 'center', containerPadding: '8px 32px',
          _meta: { htmlID: `u_content_divider_${makeId()}`, htmlClassNames: 'u_content_divider' },
          selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
        },
      }],
      values: { backgroundColor: '', padding: '0', border: {}, _meta: { htmlID: `u_column_${makeId()}`, htmlClassNames: 'u_column' } },
    }],
    values: {
      displayCondition: null, columns: false,
      backgroundColor: '#ffffff', columnsBackgroundColor: '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
      padding: '0', anchor: '', _meta: { htmlID: `u_row_${makeId()}`, htmlClassNames: 'u_row' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    },
  }
}

function footerRow(brand: string): UnlayerRow {
  return {
    id: makeId(),
    cells: [1],
    columns: [{
      id: makeId(),
      contents: [{
        id: makeId(),
        type: 'text',
        values: {
          containerPadding: '24px 40px',
          textAlign: 'center',
          lineHeight: '160%',
          _meta: { htmlID: `u_content_footer_${makeId()}`, htmlClassNames: 'u_content_text' },
          selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
          text: `<p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #9ca3af;">${brand}</p>
<p style="margin: 0 0 8px; font-size: 11px; color: #d1d5db;">İstanbul, Türkiye</p>
<a href="{{unsubscribe_url}}" style="font-size: 11px; color: #3b82f6;">Aboneliği iptal et</a>`,
        },
      }],
      values: { backgroundColor: '', padding: '0', border: {}, borderRadius: '0', _meta: { htmlID: `u_column_${makeId()}`, htmlClassNames: 'u_column' } },
    }],
    values: {
      displayCondition: null, columns: false,
      backgroundColor: '#f9fafb', columnsBackgroundColor: '',
      backgroundImage: { url: '', fullWidth: true, repeat: 'no-repeat', size: 'cover', position: 'center' },
      padding: '0', anchor: '', _meta: { htmlID: `u_row_footer_${makeId()}`, htmlClassNames: 'u_row' },
      selectable: true, draggable: true, duplicatable: true, deletable: true, hideable: true,
    },
  }
}

function makeDesign(rows: UnlayerRow[]): UnlayerDesign {
  return {
    counters: { u_row: rows.length, u_column: rows.length, u_content_text: rows.length },
    body: {
      id: makeId(),
      rows,
      values: { ...baseValues, _meta: { htmlID: 'u_body' } },
    },
  }
}

/* ─── Preset Designs ─────────────────────────────────────────────────────── */

export const unlayerDesigns: Record<string, UnlayerDesign> = {
  cart: makeDesign([
    heroRow({ bgColor: '#0a1628', badge: '⏰ SINIRLI SÜRE', headline: '⚡ Sepetiniz Sizi Bekliyor', subline: 'Özel %15 indiriminizi kaçırmayın!', accentColor: '#3b82f6' }),
    textRow('Merhaba {{isim}},\n\nSepetiinizde bıraktığınız ürünleri hâlâ saklıyoruz. Ama bu fırsat uzun sürmeyecek!\n\nSadece sizin için özel bir indirim hazırladık.'),
    couponRow('SEPET15', '%15 Özel İndirim', 'Son 48 saat!'),
    buttonRow('Sepetime Dön →', '#3b82f6', 'Ücretsiz kargo · Güvenli ödeme'),
    dividerRow(),
    footerRow('Mağazanız'),
  ]),

  vip: makeDesign([
    heroRow({ bgColor: '#1a1000', badge: '👑 VIP ÜYELERİMİZE ÖZEL', headline: '👑 VIP Koleksiyonunuz Hazır', subline: 'Sadece sizin için erken erişim fırsatı', accentColor: '#f59e0b' }),
    textRow('Sayın {{isim}},\n\nSadık müşterilerimizden biri olarak, yeni koleksiyonumuza herkesten önce erişme ayrıcalığına sahipsiniz.\n\nBu özel teklifimiz yalnızca 72 saat geçerlidir.'),
    couponRow('VIP20', '%20 Özel İndirim', 'Yalnızca 72 saat geçerli'),
    buttonRow('Koleksiyonu Keşfet →', '#f59e0b', 'Erken erişim · Öncelikli teslimat'),
    dividerRow(),
    footerRow('Mağazanız'),
  ]),

  launch: makeDesign([
    heroRow({ bgColor: '#0f0a28', badge: '✨ YENİ KOLEKSİYON', headline: '✨ Yeni Koleksiyon Geldi', subline: 'Bu sezonu tanımlayan parçalar şimdi burada', accentColor: '#8b5cf6' }),
    textRow('Merhaba {{isim}},\n\nBu sezonun en çok beklenen koleksiyonu nihayet burada! Özenle seçilmiş parçalar, premium kalite ve sizi en iyi hissettiren tasarımlar.\n\nStoklar kısıtlı, kaçırmayın.'),
    buttonRow('Yeni Koleksiyonu İncele →', '#8b5cf6', 'Stoklar kısıtlı · Ücretsiz kargo'),
    dividerRow(),
    footerRow('Mağazanız'),
  ]),

  flash: makeDesign([
    heroRow({ bgColor: '#1a0808', badge: '⏰ SON 24 SAAT', headline: '🔥 Flash Sale Başladı!', subline: 'Seçili ürünlerde %30\'a varan indirim — gece yarısı sona eriyor', accentColor: '#ef4444' }),
    textRow('Merhaba {{isim}},\n\nBu fırsatı bekliyordunuz! Seçili tüm ürünlerde %30\'a varan indirim — ama sadece 24 saat!\n\nGece yarısı sona eriyor. Şimdi harekete geçin.'),
    couponRow('FLASH30', '%30\'a Kadar İndirim', '⏰ Gece yarısı sona eriyor!'),
    buttonRow('⚡ Hemen Alışverişe Başla', '#ef4444', 'Ücretsiz kargo · Kolay iade'),
    footerRow('Mağazanız'),
  ]),

  winback: makeDesign([
    heroRow({ bgColor: '#051a0d', badge: '💚 SİZİ ÖZLEDİK', headline: '💚 Sizi Özledik!', subline: 'Geri dönmeniz için özel bir sürpriz hazırladık', accentColor: '#10b981' }),
    textRow('Merhaba {{isim}},\n\nBir süredir sizi göremedik ve özledik. Geri dönmeniz için özel bir hediye hazırladık.\n\nBu kodu kullanarak ilk alışverişinizde indirimden faydalanın!'),
    couponRow('OZLEDIK15', '%15 Hoş Geldin İndirimi', '30 gün geçerli'),
    buttonRow('Alışverişe Dön →', '#10b981', 'Sizi tekrar görmek ne güzel!'),
    footerRow('Mağazanız'),
  ]),

  birthday: makeDesign([
    heroRow({ bgColor: '#1a0814', badge: '🎁 SÜRPRIZ HEDİYE', headline: '🎂 Doğum Günün Kutlu Olsun!', subline: 'Bu özel gün için sana bir sürpriz hazırladık', accentColor: '#ec4899' }),
    textRow('Sevgili {{isim}},\n\nDoğum günün kutlu olsun! Bu özel gününüzde yanınızda olmak istedik.\n\nSana özel bir hediye hazırladık. Kodu kullanarak sürprizini keşfet!'),
    couponRow('DOGUMGUN20', '%20 Doğum Günü İndirimi 🎁', '7 gün geçerli'),
    buttonRow('🎁 Hediyeni Al →', '#ec4899', 'Doğum günün kutlu olsun!'),
    footerRow('Mağazanız'),
  ]),

  welcome: makeDesign([
    heroRow({ bgColor: '#031a14', badge: '🌟 HOŞ GELDİNİZ', headline: '🌟 Ailemize Hoş Geldiniz!', subline: 'Katıldığınız için çok mutluyuz', accentColor: '#059669' }),
    textRow('Merhaba {{isim}},\n\nBize katıldığınız için çok mutluyuz! Ailemizin yeni bir üyesi olarak sizi özel hissettirmek istiyoruz.\n\nİlk alışverişinizde size özel bir indirim sunuyoruz.'),
    couponRow('HOSGELDIN10', '%10 İlk Alışveriş İndirimi', '30 gün geçerli'),
    buttonRow('Alışverişe Başla →', '#059669', 'İlk siparişte ücretsiz kargo'),
    dividerRow(),
    footerRow('Mağazanız'),
  ]),

  restock: makeDesign([
    heroRow({ bgColor: '#051620', badge: '⚡ STOĞA DÖNDÜ', headline: '⚡ O Ürün Geri Döndü!', subline: 'Beklediğiniz an geldi — stoklar kısıtlı', accentColor: '#06b6d4' }),
    textRow('Merhaba {{isim}},\n\nHarika haber! İstediğiniz ürün stoğumuza döndü. Ancak stoklar çok kısıtlı ve hızlı tükenecek.\n\nKaçırmadan önce hemen sipariş verin!'),
    buttonRow('⚡ Hemen Satın Al →', '#06b6d4', 'Stoklar kısıtlı · Hızlı tükeniyor'),
    footerRow('Mağazanız'),
  ]),
}

export function getUnlayerDesign(id: string): UnlayerDesign | null {
  return unlayerDesigns[id] ?? null
}
