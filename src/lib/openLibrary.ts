import type { BookMetadata } from '../types'
import { normalizeGenre } from './genre'

interface OpenLibraryEntry {
  title?: string
  authors?: { name: string }[]
  cover?: { small?: string; medium?: string; large?: string }
  subjects?: { name: string }[]
  excerpts?: { text: string }[]
  notes?: string
}

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string
    authors?: string[]
    categories?: string[]
    description?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
}

async function fetchFromOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = (await response.json()) as Record<string, OpenLibraryEntry>
    const entry = data[`ISBN:${isbn}`]
    if (!entry) return null

    return {
      isbn,
      title: entry.title ?? 'Titre inconnu',
      authors: entry.authors?.map((a) => a.name) ?? [],
      coverUrl: entry.cover?.medium ?? entry.cover?.large ?? entry.cover?.small ?? null,
      genre: normalizeGenre(entry.subjects?.map((s) => s.name) ?? []),
      synopsis: entry.excerpts?.[0]?.text ?? entry.notes ?? null,
      rating: 0,
    }
  } catch {
    return null
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    const response = await fetch(url)
    if (!response.ok) return null

    const data = (await response.json()) as { items?: GoogleBooksVolume[] }
    const info = data.items?.[0]?.volumeInfo
    if (!info) return null

    const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null

    return {
      isbn,
      title: info.title ?? 'Titre inconnu',
      authors: info.authors ?? [],
      coverUrl: thumbnail ? thumbnail.replace(/^http:/, 'https:') : null,
      genre: normalizeGenre(info.categories ?? []),
      synopsis: info.description ?? null,
      rating: 0,
    }
  } catch {
    return null
  }
}

export async function fetchBookByIsbn(isbn: string): Promise<BookMetadata | null> {
  const fromOpenLibrary = await fetchFromOpenLibrary(isbn)
  if (fromOpenLibrary) return fromOpenLibrary

  return fetchFromGoogleBooks(isbn)
}
