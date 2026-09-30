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
export function groupBooks(books: Book[], shelf: Shelf | null): BookGroup[] {
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

// Data the previous page already had (e.g. the library room), handed over through the
// router state so the shelf page opens filled: the shelf and its books, plus the whole
// library for the 3D close-up, which rebuilds the library room around the bookcase.
export type ShelfPreview = {
  shelf: Shelf
  books: Book[]
  shelves?: Shelf[]
  booksByShelf?: Record<string, Book[]>
}

// A shelf, its books (raw and grouped by the shelf's mode) and the actions on them —
// shared by the classic and 3D shelf views. `preview` (data the previous page already had,
// e.g. the library room) is shown until the live subscriptions answer, so the page opens
// filled instead of empty.
export function useShelfBooks(shelfId: string | undefined, preview?: ShelfPreview) {
  const { user } = useAuth()
  const usablePreview = preview && preview.shelf.id === shelfId ? preview : undefined
  const [shelf, setShelf] = useState<Shelf | null>(usablePreview?.shelf ?? null)
  const [books, setBooks] = useState<Book[]>(usablePreview?.books ?? [])

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToShelf(user.uid, shelfId, setShelf)
  }, [user, shelfId])

  useEffect(() => {
    if (!user || !shelfId) return
    return subscribeToBooks(user.uid, shelfId, setBooks)
  }, [user, shelfId])

  const groups = useMemo(() => groupBooks(books, shelf), [books, shelf])

  // Adds to this shelf unless another one is given
  async function add(metadata: BookMetadata, targetShelfId = shelfId) {
    if (!user || !targetShelfId) return
    await addBook(user.uid, targetShelfId, metadata)
  }

  async function update(bookId: string, metadata: BookMetadata) {
    if (!user || !shelfId) return
    await updateBook(user.uid, shelfId, bookId, {
      title: metadata.title,
      subtitle: metadata.subtitle,
      tome: metadata.tome,
      seriesId: metadata.seriesId,
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
