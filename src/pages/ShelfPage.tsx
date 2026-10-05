import { useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useViewMode } from '../context/ViewModeContext'
import { useShelfBooks, type ShelfPreview } from '../hooks/useShelfBooks'
import { AddBookModal } from '../components/AddBookModal'
import { BookDetailModal } from '../components/BookDetailModal'
import { MoveBookModal } from '../components/MoveBookModal'
import { ShelfClassic } from './shelf/ShelfClassic'
import { Shelf3D } from './shelf/Shelf3D'
import type { Book, BookMetadata } from '../types'

// Owns the shelf's data, the add button and the modals; only the display switches between
// the classic view (book cards) and the 3D one (close-up of the bookcase), so both offer
// exactly the same actions.
export function ShelfPage() {
  const { shelfId } = useParams<{ shelfId: string }>()
  const { user } = useAuth()
  const { viewMode } = useViewMode()
  const location = useLocation()
  const preview = (location.state as { preview?: ShelfPreview } | null)?.preview
  const { shelf, books, groups, add, update, remove, move } = useShelfBooks(shelfId, preview)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [movingBook, setMovingBook] = useState<Book | null>(null)

  async function handleConfirmAdd(metadata: BookMetadata, targetShelfId: string) {
    await add(metadata, targetShelfId)
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
    <>
      {viewMode === '3d' ? (
        <Shelf3D shelfId={shelfId ?? ''} preview={preview} onSelectBook={setSelectedBook} />
      ) : (
        <ShelfClassic
          shelf={shelf}
          groups={groups}
          isEmpty={books.length === 0}
          onSelectBook={setSelectedBook}
        />
      )}

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-2xl text-white shadow-lg"
        aria-label="Ajouter un livre"
      >
        +
      </button>

      {showAddModal && (
        <AddBookModal
          defaultShelfId={shelfId ?? ''}
          onConfirm={handleConfirmAdd}
          onClose={() => setShowAddModal(false)}
        />
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
          onDelete={async () => {
            await remove(selectedBook.id)
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
    </>
  )
}
