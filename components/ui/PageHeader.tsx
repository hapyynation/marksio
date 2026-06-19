import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: React.ReactNode
  className?: string
}

export default function PageHeader({ title, subtitle, children, className = '' }: PageHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 flex-wrap ${className}`}
      style={{ padding: '20px 24px 0' }}
    >
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 flex-wrap">{children}</div>
      )}
    </div>
  )
}
