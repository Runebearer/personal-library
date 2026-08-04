import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Shelf, ShelfMode } from '../types'

const MODE_LABELS: Record<ShelfMode, string> = {
  custom: 'Perso',
  genre: 'Genre',
  author: 'Auteur',
  title: 'Titre',
}

export function ShelfCard({
  shelf,
  onRename,
  onDelete,
}: {
  shelf: Shelf
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(shelf.name)

  function handleRenameSubmit() {
    const trimmed = name.trim()
    if (trimmed && trimmed !== shelf.name) {
      onRename(trimmed)
    } else {
      setName(shelf.name)
    }
    setRenaming(false)
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleRenameSubmit}
          className="text-sm font-medium text-gray-900"
        >
          OK
        </button>
      </div>
    )
  }

  return (
    <div className="relative flex items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <Link to={`/shelves/${shelf.id}`} className="flex flex-1 items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{shelf.name}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {shelf.mode === 'genre' && shelf.genreFilter ? shelf.genreFilter : MODE_LABELS[shelf.mode]}
          </span>
        </span>
        <span className="text-gray-400">›</span>
      </Link>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Options de l'étagère"
        className="px-1 text-lg text-gray-400"
      >
        ⋯
      </button>
      {menuOpen && (
        <div className="absolute right-2 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              setRenaming(true)
            }}
            className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
          >
            Renommer
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              onDelete()
            }}
            className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}
