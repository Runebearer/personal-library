import { Link } from 'react-router-dom'
import { BookCard } from '../../components/BookCard'
import { ViewModeToggle } from '../../components/ViewModeToggle'
import type { BookGroup } from '../../hooks/useShelfBooks'
import type { Book, Shelf } from '../../types'

// Classic shelf view: one card per book, grouped according to the shelf's mode.
export function ShelfClassic({
  shelf,
  groups,
  isEmpty,
  onSelectBook,
  onDeleteBook,
}: {
  shelf: Shelf | null
  groups: BookGroup[]
  isEmpty: boolean
  onSelectBook: (book: Book) => void
  onDeleteBook: (book: Book) => void
}) {
  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      <header className="flex items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-3">
          <Link to="/library" className="text-gray-500">
            ‹
          </Link>
          <h1 className="text-xl font-semibold text-gray-900">{shelf?.name ?? 'Livres'}</h1>
        </div>
        <ViewModeToggle />
      </header>

      {isEmpty ? (
        <p className="pt-8 text-center text-sm text-gray-400">
          Aucun livre sur cette étagère. Scannez un code-barres pour en ajouter un.
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {groups.map((group) => (
            <div key={group.heading ?? '_'} className="flex flex-col gap-2">
              {group.heading && (
                <h2 className="text-sm font-medium text-gray-500">{group.heading}</h2>
              )}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {group.books.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onClick={() => onSelectBook(book)}
                    onDelete={() => onDeleteBook(book)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
