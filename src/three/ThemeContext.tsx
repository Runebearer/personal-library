import { createContext, useContext, type ReactNode } from 'react'
import { defaultTheme, type LibraryTheme } from './theme'

const ThemeContext = createContext<LibraryTheme>(defaultTheme)

export function LibraryThemeProvider({
  theme = defaultTheme,
  children,
}: {
  theme?: LibraryTheme
  children: ReactNode
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useLibraryTheme() {
  return useContext(ThemeContext)
}
