interface ScreenshotSlotProps {
  step: string
  alt: string
  src?: string
  aspectRatio?: string
}

export default function ScreenshotSlot({ step, alt, src, aspectRatio = '16/9' }: ScreenshotSlotProps) {
  if (src) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} />
      </div>
    )
  }
  return (
    <div
      data-screenshot-slot={step}
      className="rounded-xl flex flex-col items-center justify-center gap-2"
      style={{
        aspectRatio,
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.12)',
        color: '#44445a',
        minHeight: 180,
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#33334a' }}>image</span>
      <p style={{ fontSize: 12, color: '#44445a' }}>Görsel eklenecek</p>
      <p style={{ fontSize: 10, color: '#33334a', textAlign: 'center', maxWidth: 240, lineHeight: 1.4 }}>{alt}</p>
    </div>
  )
}
