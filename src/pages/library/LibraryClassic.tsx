import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ManageShelvesSheet, SearchSheet } from '../../components/LibrarySheets'
import { ViewModeToggle } from '../../components/ViewModeToggle'
import { useShelves } from '../../hooks/useShelves'

const toolButtonClass =
  'flex-1 rounded-lg bg-white py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-200'

// Classic library: the shelves to open, plus the same two tools as the 3D library
// (search, manage shelves) in the same sheets.
export function LibraryClassic() {
  const { shelves, loaded } = useShelves()
  const [managing, setManaging] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-gray-50 pb-8">
      <header className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-500">
            ‹
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">La bibliothèque</h1>
        </div>
        <ViewModeToggle />
      </header>

      <div className="flex flex-col gap-4 px-4">
        <div className="flex gap-2">
          <button type="button" onClick={() => setSearchOpen(true)} className={toolButtonClass}>
            Rechercher
          </button>
          <button type="button" onClick={() => setManaging(true)} className={toolButtonClass}>
            Gérer les étagères
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {loaded && shelves.length === 0 && (
            <p className="pt-8 text-center text-sm text-gray-400">
              La bibliothèque est vide. Créez une étagère pour commencer.
            </p>
          )}
          {shelves.map((shelf) => (
            <Link
              key={shelf.id}
              to={`/shelves/${shelf.id}`}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200"
            >
              <span className="font-medium text-gray-900">{shelf.name}</span>
              <span className="text-gray-400">›</span>
            </Link>
          ))}
        </div>
      </div>

      {searchOpen && <SearchSheet onClose={() => setSearchOpen(false)} />}
      {managing && <ManageShelvesSheet onClose={() => setManaging(false)} />}
    </div>
  )
}
