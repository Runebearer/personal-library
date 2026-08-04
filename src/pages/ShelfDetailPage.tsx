import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addBook, deleteBook, subscribeToBooks } from '../firebase/firestore'
import { BookCard } from '../components/BookCard'
import { AddBookModal } from '../components/AddBookModal'
import type { Book, BookMetadata } from '../types'

export function ShelfDetailPage() {
  const { shelfId } = useParams<{ shelfId: string }>()
  const { user } = useAuth()
  const [books, setBooks] = useState<Book[]>([])
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToBooks(user.uid, shelfId, setBooks)
  }, [user, shelfId])

  async function handleConfirmAdd(metadata: BookMetadata) {
    if (!user || !shelfId) return
    await addBook(user.uid, shelfId, metadata)
    setShowAddModal(false)
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-24">
      <header className="flex items-center gap-3 px-4 py-4">
        <Link to="/" className="text-gray-500">
          ‹
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Livres</h1>
      </header>

      <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3">
        {books.length === 0 && (
          <p className="col-span-full pt-8 text-center text-sm text-gray-400">
            Aucun livre sur cette étagère. Scannez un code-barres pour en ajouter un.
          </p>
        )}
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onDelete={() => user && shelfId && deleteBook(user.uid, shelfId, book.id)}
          />
        ))}
      </div>

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
    </div>
  )
}
