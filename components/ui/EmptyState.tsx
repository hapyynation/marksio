interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon = 'inbox', title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: '48px 24px' }}
    >
      <div
        className="flex items-center justify-center rounded-2xl mb-4"
        style={{ width: 56, height: 56, background: '#F3F4F6' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#9CA3AF' }}>{icon}</span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{title}</p>
      {description && (
        <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 320, lineHeight: 1.5 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}
