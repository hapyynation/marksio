interface ScreenshotSlotProps {
  step: string
  alt: string
  src?: string
  caption?: string
  aspectRatio?: string
  theme?: 'dark' | 'light'
}

export default function ScreenshotSlot({ step, alt, src, caption, aspectRatio = '16/9', theme = 'dark' }: ScreenshotSlotProps) {
  if (src) {
    const borderColor = theme === 'light' ? '1px solid #E5E7EB' : '1px solid rgba(255,255,255,0.08)'
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: borderColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} />
        {caption && (
          <div style={{
            padding: '7px 14px',
            background: theme === 'light' ? '#F9FAFB' : 'rgba(255,255,255,0.03)',
            borderTop: theme === 'light' ? '1px solid #E5E7EB' : '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: 11, color: theme === 'light' ? '#6B7280' : '#8080a0', margin: 0, textAlign: 'center', lineHeight: 1.4 }}>
              {caption}
            </p>
          </div>
        )}
      </div>
    )
  }

  const colors = theme === 'light'
    ? { bg: '#F3F4F6', border: '#D1D5DB', icon: '#9CA3AF', text: '#6B7280', subtext: '#9CA3AF' }
    : { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.12)', icon: '#33334a', text: '#44445a', subtext: '#33334a' }

  return (
    <div
      data-screenshot-slot={step}
      className="rounded-xl flex flex-col items-center justify-center gap-2"
      style={{
        aspectRatio,
        background: colors.bg,
        border: `1px dashed ${colors.border}`,
        minHeight: 140,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 28, color: colors.icon }}>image</span>
      <p style={{ fontSize: 12, color: colors.text, margin: 0 }}>Görsel eklenecek</p>
      <p style={{ fontSize: 10, color: colors.subtext, textAlign: 'center', maxWidth: 240, lineHeight: 1.4, margin: 0 }}>{caption ?? alt}</p>
    </div>
  )
}
