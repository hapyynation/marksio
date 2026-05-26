'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from 'react'
import { Monitor, Smartphone } from 'lucide-react'

export interface GrapeEditorHandle {
  getHtml: () => string
  getCss: () => string
  getFullHtml: () => string
  setContent: (html: string) => void
}

interface GrapeEditorProps {
  onReady?: () => void
  initialHtml?: string
  storeName?: string
}

function getDefaultTemplate(storeName: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>*{box-sizing:border-box;}body{margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f4f5f7;}</style>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:48px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">
  <tr><td style="background:#ffffff;padding:24px 40px;border-bottom:1px solid #f0f0f0;text-align:center;">
    <span style="font-size:20px;font-weight:800;color:#111111;letter-spacing:-0.5px;">${storeName}</span>
  </td></tr>
  <tr><td style="background:linear-gradient(135deg,#0a1628 0%,#1e3a7f 60%,#0066ff 100%);padding:64px 40px;text-align:center;">
    <p style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;">Özel Kampanya</p>
    <h1 style="color:#ffffff;font-size:36px;font-weight:800;line-height:1.2;margin:0 0 20px;letter-spacing:-0.5px;">Sınırlı Süreli<br>Fırsat Sizi Bekliyor</h1>
    <p style="color:rgba(255,255,255,0.75);font-size:16px;line-height:1.6;margin:0 0 36px;">En sevdiğiniz ürünlerde özel indirim fırsatını kaçırmayın.</p>
    <a href="#" style="background:#ffffff;color:#0066ff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:8px;display:inline-block;">Alışverişe Başla →</a>
  </td></tr>
  <tr><td style="padding:48px 40px 32px;">
    <h2 style="color:#111111;font-size:22px;font-weight:700;margin:0 0 16px;">Merhaba,</h2>
    <p style="color:#555555;font-size:15px;line-height:1.75;margin:0 0 24px;">Kampanya metnini buraya yazın. Metinlere tıklayarak düzenleyebilirsiniz. Sağdaki AI Studio panelinden içerik değişiklikleri yapabilirsiniz.</p>
    <a href="#" style="color:#0066ff;font-size:14px;font-weight:600;text-decoration:none;">Koleksiyona Göz At →</a>
  </td></tr>
  <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #f0f0f0;margin:0;"/></td></tr>
  <tr><td style="padding:40px;text-align:center;">
    <div style="background:#f8faff;border:1px solid #dce8ff;border-radius:12px;padding:32px;">
      <p style="color:#0066ff;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">Sınırlı Teklif</p>
      <h3 style="color:#111111;font-size:28px;font-weight:800;margin:0 0 8px;">%20 İndirim</h3>
      <p style="color:#777777;font-size:14px;margin:0 0 24px;">İlk siparişinizde geçerlidir.</p>
      <a href="#" style="background:#0066ff;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;display:inline-block;">Kuponu Kullan</a>
    </div>
  </td></tr>
  <tr><td style="background:#f8f9fa;border-top:1px solid #eeeeee;padding:28px 40px;text-align:center;">
    <p style="color:#374151;font-size:13px;font-weight:600;margin:0 0 6px;">${storeName}</p>
    <p style="color:#9ca3af;font-size:11px;margin:0 0 12px;">İstanbul, Türkiye</p>
    <a href="#" style="color:#9ca3af;font-size:11px;text-decoration:underline;">Abonelikten çık</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

const EDIT_STYLE = `
  body { cursor: auto !important; outline: none !important; }
  [contenteditable] { outline: none; }
  a { pointer-events: none; }
`

const GrapeEditor = forwardRef<GrapeEditorHandle, GrapeEditorProps>(
  function GrapeEditor({ onReady, initialHtml, storeName = 'Mağazanız' }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const initDone = useRef(false)
    const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')

    const writeToIframe = useCallback((html: string) => {
      const iframe = iframeRef.current
      if (!iframe) return
      const doc = iframe.contentDocument || iframe.contentWindow?.document
      if (!doc) return

      doc.open()
      doc.write(html)
      doc.close()

      setTimeout(() => {
        try {
          const d = iframe.contentDocument
          if (!d) return
          // Enable content editing on the body
          if (d.body) {
            d.body.setAttribute('contenteditable', 'true')
          }
          // Inject edit helper styles
          if (!d.getElementById('__edit_style__')) {
            const s = d.createElement('style')
            s.id = '__edit_style__'
            s.textContent = EDIT_STYLE
            d.head.appendChild(s)
          }
          // Auto-resize iframe
          const height = d.documentElement.scrollHeight
          if (height > 100) iframe.style.height = height + 'px'
        } catch {}
      }, 80)
    }, [])

    useImperativeHandle(ref, () => ({
      getHtml: () => iframeRef.current?.contentDocument?.body?.innerHTML || '',
      getCss: () => '',
      getFullHtml: () => {
        const doc = iframeRef.current?.contentDocument
        if (!doc) return ''
        try {
          const clone = doc.documentElement.cloneNode(true) as HTMLElement
          // Remove edit helpers
          clone.querySelector('#__edit_style__')?.remove()
          const body = clone.querySelector('body')
          if (body) {
            body.removeAttribute('contenteditable')
          }
          return '<!DOCTYPE html>' + clone.outerHTML
        } catch {
          return ''
        }
      },
      setContent: writeToIframe,
    }))

    useEffect(() => {
      if (initDone.current) return
      initDone.current = true
      // Small delay to ensure iframe is mounted
      setTimeout(() => {
        writeToIframe(initialHtml || getDefaultTemplate(storeName))
        setTimeout(() => onReady?.(), 200)
      }, 50)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#08080f' }}>

        {/* ── Device Toolbar ── */}
        <div
          className="shrink-0 flex items-center gap-2 px-6"
          style={{ height: 48, background: '#0f0f14', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={() => setDeviceMode('desktop')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={deviceMode === 'desktop'
              ? { background: 'rgba(0,241,254,0.08)', color: '#00f1fe', border: '1px solid rgba(0,241,254,0.2)' }
              : { color: '#5a5f72', border: '1px solid transparent' }}
          >
            <Monitor className="w-3.5 h-3.5" />
            Masaüstü
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={deviceMode === 'mobile'
              ? { background: 'rgba(0,241,254,0.08)', color: '#00f1fe', border: '1px solid rgba(0,241,254,0.2)' }
              : { color: '#5a5f72', border: '1px solid transparent' }}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Mobil
          </button>

          <div className="mx-3 h-4 w-px" style={{ background: 'rgba(255,255,255,0.06)' }} />

          <span className="text-[11px]" style={{ color: '#3a3f52' }}>
            Metinlere tıklayarak düzenleyebilirsiniz &nbsp;·&nbsp; Gelişmiş düzenleme için AI Studio
          </span>
        </div>

        {/* ── Scrollable Canvas ── */}
        <div
          className="flex-1 overflow-y-auto flex justify-center py-10"
          style={{ background: '#08080f' }}
        >
          <div
            style={{
              width: deviceMode === 'mobile' ? 480 : 660,
              transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
              flexShrink: 0,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Email Editör"
              style={{
                width: '100%',
                minHeight: 600,
                height: 'auto',
                border: 'none',
                borderRadius: 12,
                display: 'block',
                boxShadow: '0 8px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
              }}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    )
  }
)

GrapeEditor.displayName = 'GrapeEditor'
export default GrapeEditor
