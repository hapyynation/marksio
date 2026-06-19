'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: number
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, children, maxWidth = 480, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.35)', animation: 'fadeIn 0.15s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          width: '100%',
          maxWidth,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          animation: 'scaleIn 0.15s ease',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between"
            style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#9CA3AF' }}>close</span>
            </button>
          </div>
        )}
        <div style={{ padding: '20px' }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid #E5E7EB',
              background: '#F9FAFB',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
