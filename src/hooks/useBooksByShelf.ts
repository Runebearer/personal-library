import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { subscribeToBooks } from '../firebase/firestore'
import { groupBooks } from './useShelfBooks'
import type { Book, Shelf } from '../types'

// Live books of every given shelf, keyed by shelf id and already in each shelf's display
// order (its sort mode / genre filter) — for views that show several shelves at once, like
// the 3D library room. `initial` (books the previous page already had) is shown until the
// live subscriptions answer.
export function useBooksByShelf(shelves: Shelf[], initial?: Record<string, Book[]>) {
  const { user } = useAuth()
  const [raw, setRaw] = useState<Record<string, Book[]>>(initial ?? {})
  const shelfIds = shelves.map((s) => s.id).join(',')

  useEffect(() => {
    if (!user || !shelfIds) return
    const unsubscribes = shelfIds
      .split(',')
      .map((id) =>
        subscribeToBooks(user.uid, id, (books) => setRaw((prev) => ({ ...prev, [id]: books }))),
      )
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe())
  }, [user, shelfIds])

  return useMemo(() => {
    const byShelf: Record<string, Book[]> = {}
    for (const shelf of shelves) {
      byShelf[shelf.id] = groupBooks(raw[shelf.id] ?? [], shelf).flatMap((g) => g.books)
    }
    return byShelf
  }, [shelves, raw])
}
