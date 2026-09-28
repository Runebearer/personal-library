import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createShelf, deleteShelf, renameShelf, subscribeToShelves } from '../firebase/firestore'
import type { Shelf, ShelfMode } from '../types'

// The user's shelves plus the actions on them — shared by the classic and 3D library views
// so both render the same data and behave identically.
export function useShelves() {
  const { user } = useAuth()
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeToShelves(user.uid, (next) => {
      setShelves(next)
      setLoaded(true)
    })
  }, [user])

  async function create(name: string, mode: ShelfMode, genreFilter: string | null = null) {
    if (!user || !name.trim()) return null
    const ref = await createShelf(user.uid, name.trim(), mode, genreFilter)
    return ref.id
  }

  function rename(shelfId: string, name: string) {
    if (!user) return
    return renameShelf(user.uid, shelfId, name)
  }

  function remove(shelfId: string) {
    if (!user) return
    if (!confirm('Supprimer cette étagère et tous ses livres ?')) return
    return deleteShelf(user.uid, shelfId)
  }

  return { shelves, loaded, create, rename, remove }
}
