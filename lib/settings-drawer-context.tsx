'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SettingsDrawerCtx {
  isOpen: boolean
  open: () => void
  close: () => void
}

const SettingsDrawerContext = createContext<SettingsDrawerCtx>({
  isOpen: false, open: () => {}, close: () => {},
})

export function SettingsDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SettingsDrawerContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </SettingsDrawerContext.Provider>
  )
}

export const useSettingsDrawer = () => useContext(SettingsDrawerContext)
