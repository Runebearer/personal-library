import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { Series } from '../types'

// The user's series by id, for the 3D scenes: react-three-fiber's Canvas doesn't carry the
// app's contexts over, so the scene components read the series outside the Canvas and hand
// them in through this one (same trick as ThemeContext).
const SeriesContext = createContext<Record<string, Series>>({})

export function SeriesProvider({ series, children }: { series: Series[]; children: ReactNode }) {
  const byId = useMemo(() => Object.fromEntries(series.map((s) => [s.id, s])), [series])
  return <SeriesContext.Provider value={byId}>{children}</SeriesContext.Provider>
}

export function useSeriesById() {
  return useContext(SeriesContext)
}
