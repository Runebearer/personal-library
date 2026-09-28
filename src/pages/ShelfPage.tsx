import { lazy, Suspense, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useViewMode } from '../context/ViewModeContext'
import { useShelfBooks } from '../hooks/useShelfBooks'
import { ViewModeToggle } from '../components/ViewModeToggle'
import { AddBookModal } from '../components/AddBookModal'
import { BookDetailModal } from '../components/BookDetailModal'
import { MoveBookModal } from '../components/MoveBookModal'
import { ShelfClassic } from './shelf/ShelfClassic'
import type { Book, BookMetadata } from '../types'

const Shelf3DView = lazy(() =>
  import('./shelf/Shelf3DView').then((m) => ({ default: m.Shelf3DView })),
)

// Owns the shelf's data and modals; only the book display switches between the classic
// and 3D views, so both offer exactly the same actions.
export function ShelfPage() {
  const { shelfId } = useParams<{ shelfId: string }>()
  const { user } = useAuth()
  const { viewMode } = useViewMode()
  const { shelf, books, groups, add, update, remove, move } = useShelfBooks(shelfId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [movingBook, setMovingBook] = useState<Book | null>(null)

  async function handleConfirmAdd(metadata: BookMetadata) {
    await add(metadata)
    setShowAddModal(false)
  }

  async function handleConfirmEdit(metadata: BookMetadata) {
    if (!selectedBook) return
    await update(selectedBook.id, metadata)
    setSelectedBook(null)
  }

  async function handleMoveBook(toShelfId: string) {
    if (!movingBook) return
    await move(movingBook.id, toShelfId)
    setMovingBook(null)
  }

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

      {books.length === 0 && (
        <p className="col-span-full pt-8 text-center text-sm text-gray-400">
          Aucun livre sur cette étagère. Scannez un code-barres pour en ajouter un.
        </p>
      )}

      {books.length > 0 && viewMode === '3d' && (
        <div className="px-4">
          <Suspense
            fallback={
              <div className="flex h-[65vh] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                Chargement de la vue 3D…
              </div>
            }
          >
            <Shelf3DView
              books={groups.flatMap((g) => g.books)}
              onSelectBook={setSelectedBook}
            />
          </Suspense>
        </div>
      )}

      {books.length > 0 && viewMode === 'classic' && (
        <ShelfClassic
          groups={groups}
          onSelectBook={setSelectedBook}
          onDeleteBook={(book) => remove(book.id)}
        />
      )}

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white shadow-lg"
        aria-label="Ajouter un livre"
      >
        +
      </button>

      {showAddModal && (
        <AddBookModal onConfirm={handleConfirmAdd} onClose={() => setShowAddModal(false)} />
      )}

      {selectedBook && (
        <BookDetailModal
          metadata={selectedBook}
          confirmLabel="Enregistrer"
          onConfirm={handleConfirmEdit}
          onClose={() => setSelectedBook(null)}
          onMoveToShelf={() => {
            setMovingBook(selectedBook)
            setSelectedBook(null)
          }}
        />
      )}

      {movingBook && user && shelfId && (
        <MoveBookModal
          uid={user.uid}
          currentShelfId={shelfId}
          onSelect={handleMoveBook}
          onClose={() => setMovingBook(null)}
        />
      )}
    </div>
  )
}
