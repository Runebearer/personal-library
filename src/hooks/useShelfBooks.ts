import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  addBook,
  deleteBook,
  moveBook,
  subscribeToBooks,
  subscribeToShelf,
  updateBook,
} from '../firebase/firestore'
import type { Book, BookMetadata, Shelf } from '../types'

export type BookGroup = { heading: string | null; books: Book[] }

// Applies the shelf's sorting mode: custom keeps insertion order, title sorts, genre
// filters, author groups by first author.
function groupBooks(books: Book[], shelf: Shelf | null): BookGroup[] {
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

// A shelf, its books (raw and grouped by the shelf's mode) and the actions on them —
// shared by the classic and 3D shelf views.
export function useShelfBooks(shelfId: string | undefined) {
  const { user } = useAuth()
  const [shelf, setShelf] = useState<Shelf | null>(null)
  const [books, setBooks] = useState<Book[]>([])

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToShelf(user.uid, shelfId, setShelf)
  }, [user, shelfId])

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToBooks(user.uid, shelfId, setBooks)
  }, [user, shelfId])

  const groups = useMemo(() => groupBooks(books, shelf), [books, shelf])

  async function add(metadata: BookMetadata) {
    if (!user || !shelfId) return
    await addBook(user.uid, shelfId, metadata)
  }

  async function update(bookId: string, metadata: BookMetadata) {
    if (!user || !shelfId) return
    await updateBook(user.uid, shelfId, bookId, {
      title: metadata.title,
      subtitle: metadata.subtitle,
      tome: metadata.tome,
      authors: metadata.authors,
      genre: metadata.genre,
      synopsis: metadata.synopsis,
      rating: metadata.rating,
    })
  }

  function remove(bookId: string) {
    if (!user || !shelfId) return
    return deleteBook(user.uid, shelfId, bookId)
  }

  async function move(bookId: string, toShelfId: string) {
    if (!user || !shelfId) return
    await moveBook(user.uid, shelfId, bookId, toShelfId)
  }

  return { shelf, books, groups, add, update, remove, move }
}
