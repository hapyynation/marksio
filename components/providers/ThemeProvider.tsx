'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  mode: ThemeMode
  theme: ResolvedTheme
  setTheme: (mode: ThemeMode) => void
  /** @deprecated binary toggle kept for backward compat; prefer setTheme */
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  theme: 'light',
  setTheme: () => {},
  toggle: () => {},
})

const STORAGE_KEY = 'theme-mode'

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'dark') return 'dark'
  if (mode === 'light') return 'light'
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('light')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const initial: ThemeMode =
      saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
    setMode(initial)
    setResolved(resolveTheme(initial))
  }, [])

  useEffect(() => {
    const r = resolveTheme(mode)
    setResolved(r)
    document.documentElement.classList.toggle('dark', r === 'dark')
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const r = resolveTheme('system')
      setResolved(r)
      document.documentElement.classList.toggle('dark', r === 'dark')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const toggle = () =>
    setMode(prev => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'))

  return (
    <ThemeContext.Provider value={{ mode, theme: resolved, setTheme: setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
