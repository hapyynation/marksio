'use client'
import { cn } from '@/lib/utils'

interface ChannelPulseLineProps {
  /**
   * idle   — düz, soluk çizgi (veri yok / pasif)
   * active — sweep animasyonu (kanal bağlı, aktif)
   * ping   — tek seferlik burst (gönderim anı)
   */
  variant?: 'idle' | 'active' | 'ping'
  className?: string
}

/**
 * Kanal kartının üst kenarındaki imza pulse çizgisi.
 * Kullanım: parent kart `position: relative; overflow: hidden` olmalı.
 *
 * <div className="bento-card relative overflow-hidden">
 *   <ChannelPulseLine variant="active" />
 *   ...
 * </div>
 */
export function ChannelPulseLine({ variant = 'idle', className }: ChannelPulseLineProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('absolute top-0 inset-x-0 h-[2px] overflow-hidden', className)}
    >
      <div
        className={cn(
          'h-full w-full',
          variant === 'idle'   && 'pulse-line-idle',
          variant === 'active' && 'pulse-line-active',
          variant === 'ping'   && 'pulse-line-ping',
        )}
      />
    </div>
  )
}
