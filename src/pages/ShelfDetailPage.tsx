import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addBook,
  deleteBook,
  moveBook,
  subscribeToBooks,
  subscribeToShelf,
  updateBook,
} from '../firebase/firestore'
import { BookCard } from '../components/BookCard'
import { AddBookModal } from '../components/AddBookModal'
import { BookDetailModal } from '../components/BookDetailModal'
import { MoveBookModal } from '../components/MoveBookModal'
import type { Book, BookMetadata, Shelf } from '../types'

const Shelf3D = lazy(() => import('../components/Shelf3D').then((m) => ({ default: m.Shelf3D })))

function groupBooks(books: Book[], shelf: Shelf | null): { heading: string | null; books: Book[] }[] {
  if (!shelf || shelf.mode === 'custom') {
    return [{ heading: null, books }]
  }

  if (shelf.mode === 'title') {
    return [{ heading: null, books: [...books].sort((a, b) => a.title.localeCompare(b.title)) }]
  }

  if (shelf.mode === 'genre') {
    const filtered = shelf.genreFilter ? books.filter((b) => b.genre === shelf.genreFilter) : books
    return [{ heading: null, books: filtered }]
  }

  const groups = new Map<string, Book[]>()
  for (const book of books) {
    const key = book.authors[0] ?? 'Auteur inconnu'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(book)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([heading, groupBooks]) => ({ heading, books: groupBooks }))
}

export function ShelfDetailPage() {
  const { shelfId } = useParams<{ shelfId: string }>()
  const { user } = useAuth()
  const [shelf, setShelf] = useState<Shelf | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [movingBook, setMovingBook] = useState<Book | null>(null)
  const [view3D, setView3D] = useState(false)

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToShelf(user.uid, shelfId, setShelf)
  }, [user, shelfId])

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToBooks(user.uid, shelfId, setBooks)
  }, [user, shelfId])

  const groups = useMemo(() => groupBooks(books, shelf), [books, shelf])

  async function handleConfirmAdd(metadata: BookMetadata) {
    if (!user || !shelfId) return
    await addBook(user.uid, shelfId, metadata)
    setShowAddModal(false)
  }

  async function handleConfirmEdit(metadata: BookMetadata) {
    if (!user || !shelfId || !selectedBook) return
    await updateBook(user.uid, shelfId, selectedBook.id, {
      title: metadata.title,
      subtitle: metadata.subtitle,
      tome: metadata.tome,
      authors: metadata.authors,
      genre: metadata.genre,
      synopsis: metadata.synopsis,
      rating: metadata.rating,
    })
    setSelectedBook(null)
  }

  async function handleMoveBook(toShelfId: string) {
    if (!user || !shelfId || !movingBook) return
    await moveBook(user.uid, shelfId, movingBook.id, toShelfId)
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
        {books.length > 0 && (
          <button
            type="button"
            onClick={() => setView3D((v) => !v)}
            className={`rounded-full px-3 py-1 text-xs ${
              view3D ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 ring-1 ring-gray-200'
            }`}
          >
            {view3D ? 'Vue liste' : 'Vue 3D'}
          </button>
        )}
      </header>

      {books.length === 0 && (
        <p className="col-span-full pt-8 text-center text-sm text-gray-400">
          Aucun livre sur cette étagère. Scannez un code-barres pour en ajouter un.
        </p>
      )}

      {books.length > 0 && view3D && (
        <div className="px-4">
          <Suspense
            fallback={
              <div className="flex h-[65vh] w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                Chargement de la vue 3D…
              </div>
            }
          >
            <Shelf3D books={books} onSelectBook={setSelectedBook} />
          </Suspense>
        </div>
      )}

      {books.length > 0 && !view3D && (
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
                    onClick={() => setSelectedBook(book)}
                    onDelete={() => user && shelfId && deleteBook(user.uid, shelfId, book.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
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
