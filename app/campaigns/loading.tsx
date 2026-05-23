import { StaticShell } from '@/components/layout/StaticShell'
import { CardSkeleton } from '@/components/ui/page-skeleton'

export default function Loading() {
  return (
    <StaticShell>
      <div className="h-14 border-b border-[#1e1e1e] flex items-center px-6">
        <span className="text-sm font-semibold text-white">Kampanyalar</span>
      </div>
      <CardSkeleton count={6} />
    </StaticShell>
  )
}
