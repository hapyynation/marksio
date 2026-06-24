import { StaticShell } from '@/components/layout/StaticShell'
import { TableSkeleton } from '@/components/ui/page-skeleton'

export default function Loading() {
  return (
    <StaticShell>
      <div className="h-14 border-b border-[var(--border)] flex items-center px-6">
        <span className="text-sm font-semibold text-[var(--text-1)]">Müşteriler</span>
      </div>
      <TableSkeleton rows={8} />
    </StaticShell>
  )
}
