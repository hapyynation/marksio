import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconSize = 'nav' | 'card' | 'inline' | number

const SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
  nav:    20,
  card:   18,
  inline: 16,
}

interface IconProps {
  icon: LucideIcon
  /** nav=20px · card=18px · inline=16px · number for custom */
  size?: IconSize
  className?: string
  'aria-label'?: string
}

/**
 * Lucide icon wrapper — enforces strokeWidth 1.5 and brand color states.
 * Default: var(--text-2). Hover/active: inherit from parent or pass className.
 */
export function Icon({ icon: LucideComponent, size = 'inline', className, ...rest }: IconProps) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size]
  return (
    <LucideComponent
      size={px}
      strokeWidth={1.5}
      className={cn('text-[var(--text-2)] shrink-0', className)}
      {...rest}
    />
  )
}
