import type { BookMetadata } from '../types'
import { normalizeGenre } from './genre'

type OpenLibraryText = string | { value?: string }

interface OpenLibraryEdition {
  title?: string
  subtitle?: string
  authors?: { key: string }[]
  covers?: number[]
  subjects?: string[]
  description?: OpenLibraryText
  notes?: OpenLibraryText
  works?: { key: string }[]
}

interface OpenLibraryWork {
  authors?: { author?: { key: string } }[]
  covers?: number[]
  subjects?: string[]
  description?: OpenLibraryText
}

interface GoogleBooksVolume {
  volumeInfo?: {
    title?: string
    subtitle?: string
    authors?: string[]
    categories?: string[]
    description?: string
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
  }
}

const OPEN_LIBRARY = 'https://openlibrary.org'
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY as string | undefined

/** Strips hyphens/spaces and returns a valid ISBN-10/13, or null. */
export function normalizeIsbn(raw: string): string | null {
  const isbn = raw.replace(/[^0-9Xx]/g, '').toUpperCase()
  if (/^\d{13}$/.test(isbn)) {
    const sum = [...isbn].reduce((acc, d, i) => acc + Number(d) * (i % 2 ? 3 : 1), 0)
    return sum % 10 === 0 ? isbn : null
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const sum = [...isbn].reduce((acc, d, i) => acc + (d === 'X' ? 10 : Number(d)) * (10 - i), 0)
    return sum % 11 === 0 ? isbn : null
  }
  return null
}

async function getJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

function readText(text: OpenLibraryText | undefined): string | null {
  if (!text) return null
  return typeof text === 'string' ? text : (text.value ?? null)
}

async function fetchFromOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  const edition = await getJson<OpenLibraryEdition>(`${OPEN_LIBRARY}/isbn/${isbn}.json`)
  if (!edition) return null

  const workKey = edition.works?.[0]?.key
  const work = workKey ? await getJson<OpenLibraryWork>(`${OPEN_LIBRARY}${workKey}.json`) : null

  const authorKeys =
    edition.authors?.map((a) => a.key) ??
    work?.authors?.flatMap((a) => (a.author ? [a.author.key] : [])) ??
    []
  const authors = await Promise.all(
    authorKeys.map((key) => getJson<{ name?: string }>(`${OPEN_LIBRARY}${key}.json`)),
  )

  const coverId = edition.covers?.find((id) => id > 0) ?? work?.covers?.find((id) => id > 0)

  return {
    isbn,
    title: edition.title ?? 'Titre inconnu',
    subtitle: edition.subtitle ?? null,
    tome: null,
    seriesId: null,
    authors: authors.flatMap((a) => (a?.name ? [a.name] : [])),
    coverUrl: coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null,
    genre: normalizeGenre(edition.subjects ?? work?.subjects ?? []),
    synopsis: readText(edition.description) ?? readText(work?.description) ?? readText(edition.notes),
    rating: 0,
  }
}

async function fetchFromGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  const keyParam = GOOGLE_BOOKS_API_KEY ? `&key=${GOOGLE_BOOKS_API_KEY}` : ''
  const data = await getJson<{ items?: GoogleBooksVolume[] }>(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${keyParam}`,
  )
  const info = data?.items?.[0]?.volumeInfo
  if (!info) return null

  const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null

  return {
    isbn,
    title: info.title ?? 'Titre inconnu',
    subtitle: info.subtitle ?? null,
    tome: null,
    seriesId: null,
    authors: info.authors ?? [],
    coverUrl: thumbnail ? thumbnail.replace(/^http:/, 'https:') : null,
    genre: normalizeGenre(info.categories ?? []),
    synopsis: info.description ?? null,
    rating: 0,
  }
}

export async function fetchBookByIsbn(isbn: string): Promise<BookMetadata | null> {
  const fromOpenLibrary = await fetchFromOpenLibrary(isbn)
  if (fromOpenLibrary) return fromOpenLibrary

  return fetchFromGoogleBooks(isbn)
}
