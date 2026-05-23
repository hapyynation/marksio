'use client'

import React, { useRef, useCallback } from 'react'
import EmailEditor, { EditorRef } from 'react-email-editor'
import { Loader2 } from 'lucide-react'

interface EmailCanvasEditorProps {
  onHtmlExport?: (html: string, design: object) => void
  initialDesign?: object
  className?: string
}

export default function EmailCanvasEditor({ onHtmlExport, initialDesign, className }: EmailCanvasEditorProps) {
  const editorRef = useRef<EditorRef>(null)
  const [ready, setReady] = React.useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReady = useCallback((unlayer: any) => {
    setReady(true)
    if (initialDesign) {
      unlayer?.loadDesign(initialDesign)
    }
  }, [initialDesign])

  const exportHtml = useCallback(() => {
    editorRef.current?.editor?.exportHtml((data) => {
      onHtmlExport?.(data.html, data.design)
    })
  }, [onHtmlExport])

  return (
    <div className={className}>
      {!ready && (
        <div className="flex items-center justify-center h-[600px] bg-[#111] border border-[#1e1e1e] rounded-xl">
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm">Editör yükleniyor...</p>
          </div>
        </div>
      )}
      <div style={{ display: ready ? 'block' : 'none' }}>
        <EmailEditor
          ref={editorRef}
          onReady={onReady}
          minHeight="600px"
          options={{
            locale: 'tr-TR',
            appearance: {
              theme: 'dark',
              panels: { tools: { dock: 'left' } },
            },
            features: {
              colorPicker: {
                presets: ['#2563EB', '#7C3AED', '#059669', '#F59E0B', '#EF4444', '#0a0a0a', '#ffffff'],
              },
            },
          } as object}
        />
      </div>
      {ready && onHtmlExport && (
        <div className="mt-3 flex justify-end">
          <button onClick={exportHtml} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all">
            HTML&apos;i Kaydet
          </button>
        </div>
      )}
    </div>
  )
}
