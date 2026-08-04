import { FormEvent, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { createShelf, deleteShelf, renameShelf, subscribeToShelves } from '../firebase/firestore'
import { signOut } from '../firebase/auth'
import { ShelfCard } from '../components/ShelfCard'
import { GENRE_LIST } from '../lib/genre'
import type { Shelf, ShelfMode } from '../types'

const MODE_OPTIONS: { value: ShelfMode; label: string }[] = [
  { value: 'custom', label: 'Perso' },
  { value: 'genre', label: 'Genre' },
  { value: 'author', label: 'Auteur' },
  { value: 'title', label: 'Titre' },
]

export function ShelvesPage() {
  const { user } = useAuth()
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [newShelfName, setNewShelfName] = useState('')
  const [newShelfMode, setNewShelfMode] = useState<ShelfMode>('custom')
  const [newShelfGenre, setNewShelfGenre] = useState(GENRE_LIST[0])

  useEffect(() => {
    if (!user) return
    return subscribeToShelves(user.uid, setShelves)
  }, [user])

  async function handleCreateShelf(e: FormEvent) {
    e.preventDefault()
    if (!user || !newShelfName.trim()) return
    const genreFilter = newShelfMode === 'genre' ? newShelfGenre : null
    await createShelf(user.uid, newShelfName.trim(), newShelfMode, genreFilter)
    setNewShelfName('')
    setNewShelfMode('custom')
    setNewShelfGenre(GENRE_LIST[0])
  }

  function handleDeleteShelf(shelfId: string) {
    if (!user) return
    if (!confirm('Supprimer cette étagère et tous ses livres ?')) return
    deleteShelf(user.uid, shelfId)
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-8">
      <header className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Mes étagères</h1>
        <button type="button" onClick={() => signOut()} className="text-sm text-gray-500">
          Déconnexion
        </button>
      </header>

      <form onSubmit={handleCreateShelf} className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex gap-2">
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
        </div>
        <div className="flex gap-2">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setNewShelfMode(option.value)}
              className={`rounded-full px-3 py-1 text-xs ${
                newShelfMode === option.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 ring-1 ring-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {newShelfMode === 'genre' && (
          <select
            value={newShelfGenre}
            onChange={(e) => setNewShelfGenre(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
          >
            {GENRE_LIST.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}
      </form>

      <div className="flex flex-col gap-2 px-4">
        {shelves.length === 0 && (
          <p className="pt-8 text-center text-sm text-gray-400">
            Aucune étagère pour le moment. Créez-en une pour commencer.
          </p>
        )}
        {shelves.map((shelf) => (
          <ShelfCard
            key={shelf.id}
            shelf={shelf}
            onRename={(name) => user && renameShelf(user.uid, shelf.id, name)}
            onDelete={() => handleDeleteShelf(shelf.id)}
          />
        ))}
      </div>
    </div>
  )
}
