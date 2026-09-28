import { FormEvent, useState } from 'react'
import { useShelves } from '../hooks/useShelves'
import { ShelfCard } from './ShelfCard'
import { GENRE_LIST } from '../lib/genre'
import type { ShelfMode } from '../types'

const MODE_OPTIONS: { value: ShelfMode; label: string }[] = [
  { value: 'custom', label: 'Perso' },
  { value: 'genre', label: 'Genre' },
  { value: 'author', label: 'Auteur' },
  { value: 'title', label: 'Titre' },
]

// Create / rename / delete shelves: the new-shelf form plus the shelf cards. Used as the
// body of the classic library page and inside the 3D library's management sheet.
export function ShelfManager() {
  const { shelves, create, rename, remove } = useShelves()
  const [newShelfName, setNewShelfName] = useState('')
  const [newShelfMode, setNewShelfMode] = useState<ShelfMode>('custom')
  const [newShelfGenre, setNewShelfGenre] = useState(GENRE_LIST[0])

  async function handleCreateShelf(e: FormEvent) {
    e.preventDefault()
    if (!newShelfName.trim()) return
    const genreFilter = newShelfMode === 'genre' ? newShelfGenre : null
    await create(newShelfName, newShelfMode, genreFilter)
    setNewShelfName('')
    setNewShelfMode('custom')
    setNewShelfGenre(GENRE_LIST[0])
  }

  return (
    <div>
      <form onSubmit={handleCreateShelf} className="flex flex-col gap-2 pb-4">
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

      <div className="flex flex-col gap-2">
        {shelves.length === 0 && (
          <p className="pt-8 text-center text-sm text-gray-400">
            Aucune étagère pour le moment. Créez-en une pour commencer.
          </p>
        )}
        {shelves.map((shelf) => (
          <ShelfCard
            key={shelf.id}
            shelf={shelf}
            onRename={(name) => rename(shelf.id, name)}
            onDelete={() => remove(shelf.id)}
          />
        ))}
      </div>
    </div>
  )
}
