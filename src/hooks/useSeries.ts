import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createSeries, subscribeToSeries, updateSeriesColor } from '../firebase/firestore'
import type { Series } from '../types'

// The user's series (sorted by name) and a way to add one. Creating a series whose name
// already exists (ignoring case and surrounding spaces) returns the existing one instead of
// making a duplicate.
export function useSeries() {
  const { user } = useAuth()
  const [series, setSeries] = useState<Series[]>([])

  useEffect(() => {
    if (!user) return
    return subscribeToSeries(user.uid, setSeries)
  }, [user])

  async function findOrCreate(name: string): Promise<string | null> {
    const trimmed = name.trim()
    if (!user || !trimmed) return null
    const existing = series.find((s) => s.name.trim().toLowerCase() === trimmed.toLowerCase())
    if (existing) return existing.id
    return createSeries(user.uid, trimmed)
  }

  async function setColor(seriesId: string, color: string | null) {
    if (!user) return
    await updateSeriesColor(user.uid, seriesId, color)
  }

  return { series, findOrCreate, setColor }
}
