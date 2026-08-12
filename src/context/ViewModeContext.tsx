import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type ViewMode = 'classic' | '3d'

const STORAGE_KEY = 'personal-library:view-mode'

function readStoredMode(): ViewMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'classic' ? 'classic' : '3d'
}

const ViewModeContext = createContext<{
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
} | null>(null)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>(readStoredMode)

  const setViewMode = useCallback((mode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, mode)
    setViewModeState(mode)
  }, [])

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext)
  if (!ctx) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return ctx
}
