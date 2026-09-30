import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useShelves } from '../hooks/useShelves'
import { fetchBooksOfShelves, moveBook, updateBook } from '../firebase/firestore'
import { BookCard } from './BookCard'
import { BookDetailModal } from './BookDetailModal'
import { MoveBookModal } from './MoveBookModal'
import type { Book, BookMetadata } from '../types'

type SearchField = 'title' | 'author'

const FIELD_OPTIONS: { value: SearchField; label: string }[] = [
  { value: 'title', label: 'Titre' },
  { value: 'author', label: 'Auteur' },
]

type Result = { book: Book; shelfId: string; shelfName: string }

// Case- and accent-insensitive, so "celine" finds "Céline"
function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

function matches(book: Book, field: SearchField, needle: string) {
  const haystacks = field === 'title' ? [book.title, book.subtitle ?? ''] : book.authors
  return haystacks.some((text) => normalize(text).includes(needle))
}

// Searches the titles or the authors of every book in the library (all shelves, genre
// filters ignored) and lists the matches as book cards in a sheet; a card opens the book,
// which can be edited or moved to another shelf from there.
export function BookSearch() {
  const { user } = useAuth()
  const { shelves } = useShelves()
  const [text, setText] = useState('')
  const [field, setField] = useState<SearchField | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{
    query: string
    field: SearchField
    items: Result[]
  } | null>(null)
  const [selected, setSelected] = useState<Result | null>(null)
  const [moving, setMoving] = useState<Result | null>(null)

  const canSearch = field !== null && text.trim() !== '' && !searching

  async function search(query: string, searchField: SearchField) {
    if (!user) return
    const needle = normalize(query)
    const names = new Map(shelves.map((s) => [s.id, s.name]))
    const all = await fetchBooksOfShelves(user.uid, [...names.keys()])
    setResults({
      query,
      field: searchField,
      items: all
        .filter(({ book }) => matches(book, searchField, needle))
        .sort((a, b) => a.book.title.localeCompare(b.book.title))
        .map(({ book, shelfId }) => ({ book, shelfId, shelfName: names.get(shelfId) ?? '' })),
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!field || !canSearch) return
    setSearching(true)
    setError(null)
    try {
      await search(text.trim(), field)
    } catch {
      setError('La recherche a échoué. Réessayez.')
    } finally {
      setSearching(false)
    }
  }

  async function handleSave(metadata: BookMetadata) {
    if (!user || !selected) return
    const { book, shelfId } = selected
    const patch = {
      title: metadata.title,
      subtitle: metadata.subtitle,
      tome: metadata.tome,
      seriesId: metadata.seriesId,
      authors: metadata.authors,
      genre: metadata.genre,
      synopsis: metadata.synopsis,
      rating: metadata.rating,
    }
    await updateBook(user.uid, shelfId, book.id, patch)
    // keep the card in sync without searching again
    setResults((prev) =>
      prev && {
        ...prev,
        items: prev.items.map((item) =>
          item.book.id === book.id && item.shelfId === shelfId
            ? { ...item, book: { ...item.book, ...patch } }
            : item,
        ),
      },
    )
    setSelected(null)
  }

  async function handleMove(toShelfId: string) {
    if (!user || !moving || !results) return
    await moveBook(user.uid, moving.shelfId, moving.book.id, toShelfId)
    setMoving(null)
    // a moved book gets a new id in its new shelf: refresh the results
    await search(results.query, results.field)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="search"
          placeholder="Rechercher un livre…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
        />
        <div className="flex items-center gap-2">
          {FIELD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={field === option.value}
              onClick={() => setField(option.value)}
              className={`rounded-full px-3 py-1 text-xs ${
                field === option.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-500 ring-1 ring-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="submit"
            disabled={!canSearch}
            className="ml-auto rounded-lg bg-gray-900 px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            {searching ? 'Recherche…' : 'Rechercher'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>

      {results && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="flex max-h-[85vh] w-full flex-col gap-3 rounded-t-2xl bg-gray-50 p-4 sm:max-w-2xl sm:rounded-2xl">
            <p className="text-center font-medium text-gray-900">
              {results.items.length === 0
                ? `Aucun livre trouvé pour « ${results.query} »`
                : `${results.items.length} livre${results.items.length > 1 ? 's' : ''} pour « ${results.query} »`}
            </p>
            {results.items.length > 0 && (
              <div className="grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
                {results.items.map(({ book, shelfId, shelfName }) => (
                  <div key={`${shelfId}/${book.id}`} className="flex flex-col gap-1">
                    <BookCard
                      book={book}
                      onClick={() => setSelected({ book, shelfId, shelfName })}
                    />
                    <p className="truncate text-center text-xs text-gray-500">{shelfName}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setResults(null)}
              className="rounded-lg py-2 text-gray-500"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {selected && (
        <BookDetailModal
          metadata={selected.book}
          confirmLabel="Enregistrer"
          onConfirm={handleSave}
          onClose={() => setSelected(null)}
          onMoveToShelf={() => {
            setMoving(selected)
            setSelected(null)
          }}
        />
      )}

      {moving && user && (
        <MoveBookModal
          uid={user.uid}
          currentShelfId={moving.shelfId}
          onSelect={handleMove}
          onClose={() => setMoving(null)}
        />
      )}
    </>
  )
}
