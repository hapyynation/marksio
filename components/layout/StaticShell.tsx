import type { ReactNode } from 'react'

export function StaticShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      <div className="fixed inset-y-0 left-0 w-56 bg-[var(--bg-sidebar)] border-r border-[var(--border)] z-30 flex flex-col">
        <div className="h-14 border-b border-[var(--border)] flex items-center px-3 gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-soft)] animate-pulse" />
          <div className="h-3 w-16 rounded bg-[var(--surface-2)] animate-pulse" />
        </div>
        <div className="mx-3 mt-4 mb-2 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] animate-pulse" />
        <div className="flex-1 px-2 py-2 space-y-1">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className="h-9 rounded-lg bg-[var(--surface-2)] animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
          ))}
        </div>
      </div>
      <main className="flex-1 min-h-screen flex flex-col lg:ml-56">
        {children}
      </main>
    </div>
  )
}
