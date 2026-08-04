import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createShelf, subscribeToShelves } from '../firebase/firestore'
import { signOut } from '../firebase/auth'
import { ShelfCard } from '../components/ShelfCard'
import type { Shelf } from '../types'

export function ShelvesPage() {
  const { user } = useAuth()
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [newShelfName, setNewShelfName] = useState('')

  useEffect(() => {
    if (!user) return
    return subscribeToShelves(user.uid, setShelves)
  }, [user])

  async function handleCreateShelf(e: FormEvent) {
    e.preventDefault()
    if (!user || !newShelfName.trim()) return
    await createShelf(user.uid, newShelfName.trim())
    setNewShelfName('')
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-8">
      <header className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Mes étagères</h1>
        <button type="button" onClick={() => signOut()} className="text-sm text-gray-500">
          Déconnexion
        </button>
      </header>

      <form onSubmit={handleCreateShelf} className="flex gap-2 px-4 pb-4">
        <input
          type="text"
          placeholder="Nouvelle étagère"
          value={newShelfName}
          onChange={(e) => setNewShelfName(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-white">
          Créer
        </button>
      </form>

      <div className="flex flex-col gap-2 px-4">
        {shelves.length === 0 && (
          <p className="pt-8 text-center text-sm text-gray-400">
            Aucune étagère pour le moment. Créez-en une pour commencer.
          </p>
        )}
        {shelves.map((shelf) => (
          <ShelfCard key={shelf.id} shelf={shelf} />
        ))}
      </div>
    </div>
  )
}
