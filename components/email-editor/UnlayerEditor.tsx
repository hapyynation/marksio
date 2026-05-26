'use client'

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import EmailEditor, { EditorRef, EmailEditorProps } from 'react-email-editor'
import type { UnlayerDesign } from '@/lib/unlayer-designs'

export interface UnlayerEditorHandle {
  exportHtml: () => Promise<{ html: string; design: UnlayerDesign }>
  loadDesign: (design: UnlayerDesign) => void
  loadBlank: () => void
}

interface Props {
  onReady?: () => void
  storeName?: string
  minHeight?: string
}

const mergeTags = {
  isim:       { name: 'Ad',           value: '{{isim}}',       sample: 'Ahmet' },
  tam_isim:   { name: 'Tam Ad',        value: '{{tam_isim}}',   sample: 'Ahmet Yılmaz' },
  siparis_no: { name: 'Sipariş No',    value: '{{siparis_no}}', sample: '#1042' },
  toplam:     { name: 'Sipariş Tutarı',value: '{{toplam}}',     sample: '₺299' },
  url:        { name: 'Sepet URL',     value: '{{url}}',        sample: 'https://ornek.com/sepet' },
  cta_url:    { name: 'CTA Linki',     value: '{{cta_url}}',    sample: 'https://ornek.com' },
  unsubscribe_url: { name: 'Abonelik İptal', value: '{{unsubscribe_url}}', sample: 'https://ornek.com/unsub' },
}

const UnlayerEditor = forwardRef<UnlayerEditorHandle, Props>(
  ({ onReady, storeName = 'Mağazanız', minHeight = 'calc(100vh - 120px)' }, ref) => {
    const editorRef = useRef<EditorRef>(null)

    useImperativeHandle(ref, () => ({
      exportHtml: () =>
        new Promise((resolve, reject) => {
          const editor = editorRef.current?.editor
          if (!editor) return reject(new Error('Editor hazır değil'))
          editor.exportHtml(({ html, design }) => {
            resolve({ html, design: design as unknown as UnlayerDesign })
          })
        }),
      loadDesign: (design: UnlayerDesign) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        editorRef.current?.editor?.loadDesign(design as any)
      },
      loadBlank: () => {
        editorRef.current?.editor?.loadBlank({ backgroundColor: '#ffffff' })
      },
    }))

    const onLoad: EmailEditorProps['onLoad'] = useCallback(() => {
      onReady?.()
    }, [onReady])

    return (
      <EmailEditor
        ref={editorRef}
        onLoad={onLoad}
        minHeight={minHeight}
        options={{
          locale: 'tr-TR',
          safeHtml: true,
          appearance: {
            theme: 'dark',
            panels: { tools: { dock: 'left' } },
          },
          features: {
            preview: true,
            imageEditor: { enabled: true },
            undoRedo: true,
            stockImages: false,
            textEditor: {
              spellChecker: false,
              tables: false,
              cleanPaste: true,
            },
          },
          mergeTags,
          designTagsConfig: { delimiter: ['{{', '}}'] },
          tools: {
            image: { enabled: true },
            video: { enabled: false },
            social: { enabled: false },
            timer: { enabled: false },
            menu: { enabled: false },
          },
          fonts: {
            showDefaultFonts: false,
            customFonts: [
              { label: 'Arial', value: 'arial,helvetica,sans-serif' },
              { label: 'Inter', value: "'Inter', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap' },
              { label: 'Poppins', value: "'Poppins', sans-serif", url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&display=swap' },
              { label: 'Courier', value: 'Courier,monospace' },
            ],
          },
          designTags: {
            store_name: storeName,
          },
        }}
      />
    )
  }
)

UnlayerEditor.displayName = 'UnlayerEditor'

export default UnlayerEditor
