import { cn } from '@/lib/utils'

export function H1({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        'font-display text-[2.25rem] font-bold leading-[1.15] tracking-[-0.01em] text-[var(--text-1)]',
        className,
      )}
      {...props}
    />
  )
}

export function H2({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'font-display text-[1.5rem] font-semibold leading-[1.25] tracking-[-0.01em] text-[var(--text-1)]',
        className,
      )}
      {...props}
    />
  )
}

export function H3({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'font-display text-[1.125rem] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-1)]',
        className,
      )}
      {...props}
    />
  )
}

export function Body({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'font-sans text-[0.9375rem] font-normal leading-[1.5] text-[var(--text-1)]',
        className,
      )}
      {...props}
    />
  )
}

export function Caption({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'font-sans text-[0.8125rem] font-medium leading-[1.4] text-[var(--text-2)]',
        className,
      )}
      {...props}
    />
  )
}

/** Sayılar, fiyatlar, metrikler — tabular-nums, mono */
export function DataText({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'font-mono text-[0.875rem] leading-[1.2] tabular-nums text-[var(--text-1)]',
        className,
      )}
      {...props}
    />
  )
}
