import { cn } from '@/lib/utils'

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-[var(--surface-2)] animate-pulse', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-[var(--surface)] to-transparent opacity-60" />
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="hidden lg:flex flex-col w-56 bg-[var(--bg-sidebar)] border-r border-[var(--border)] p-4 gap-2 shrink-0">
        <Bone className="h-8 w-32 mb-4" />
        {[...Array(6)].map((_, i) => <Bone key={i} className="h-8 w-full" />)}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-14 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center px-6 gap-4">
          <Bone className="h-5 w-32" />
          <div className="flex-1" />
          <Bone className="h-8 w-28" />
          <Bone className="h-8 w-8 rounded-full" />
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Bone key={i} className="h-24 rounded-xl" />)}
          </div>
          <Bone className="h-10 w-full rounded-xl" />
          {[...Array(5)].map((_, i) => <Bone key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="p-6 space-y-4 flex-1 bg-[var(--bg)]">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-5 space-y-3 animate-pulse">
            <div className="flex items-center gap-3">
              <Bone className="h-9 w-9 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
            </div>
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-4/5" />
            <div className="flex gap-2 pt-1">
              <Bone className="h-7 w-20 rounded-full" />
              <Bone className="h-7 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex-1 bg-[var(--bg)]">
      <div className="h-11 bg-[var(--bg-card)] border-b border-[var(--border)] px-6 flex items-center gap-4">
        <Bone className="h-4 w-24" />
        <Bone className="h-4 w-24" />
      </div>
      <div className="p-4 lg:p-6 space-y-4">
        <Bone className="h-16 w-full rounded-xl" />
        <div className="flex items-center justify-between">
          <Bone className="h-9 w-48 rounded-xl" />
          <Bone className="h-9 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Bone key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2"><Bone className="h-72 rounded-xl" /></div>
          <Bone className="h-72 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3"><Bone className="h-48 rounded-xl" /></div>
          <div className="xl:col-span-2"><Bone className="h-48 rounded-xl" /></div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-3 flex-1 bg-[var(--bg)]">
      <div className="flex gap-3 mb-2">
        <Bone className="h-9 w-64 rounded-xl" />
        <Bone className="h-9 w-32 rounded-xl" />
        <div className="flex-1" />
        <Bone className="h-9 w-28 rounded-xl" />
      </div>
      <Bone className="h-10 w-full rounded-xl" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] px-4 py-3 animate-pulse">
          <Bone className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-40" />
            <Bone className="h-3 w-28" />
          </div>
          <Bone className="h-6 w-16 rounded-full" />
          <Bone className="h-4 w-24" />
          <Bone className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}
