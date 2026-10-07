import ISBN from 'isbn3'
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

/** Set when a source failed (network, quota, key restriction) rather than answering "not found". */
class LookupError extends Error {}

/** Hyphenated ISBN-13 for display (e.g. 978-2-38071-301-5); falls back to the raw value. */
export function formatIsbn(isbn: string): string {
  return ISBN.parse(isbn)?.isbn13h ?? isbn
}

async function getJson<T>(url: string): Promise<T | null> {
  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new LookupError(`Network error: ${url}`)
  }
  if (response.status === 404) return null
  if (!response.ok) {
    console.warn(`[isbn lookup] ${response.status} on ${url.replace(/key=[^&]+/, 'key=…')}`)
    throw new LookupError(`HTTP ${response.status}`)
  }
  return (await response.json()) as T
}

/** Runs a source, turning a failure into null while remembering that it failed. */
async function attempt<T>(source: () => Promise<T | null>, failures: { count: number }): Promise<T | null> {
  try {
    return await source()
  } catch (err) {
    if (!(err instanceof LookupError)) throw err
    failures.count += 1
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

/**
 * BnF catalogue (legal deposit): covers most French books, including self-published ones.
 * It indexes ISBNs as typed by the publisher, usually hyphenated, so we query every form.
 */
async function fetchFromBnf(isbn: string): Promise<BookMetadata | null> {
  const parsed = ISBN.parse(isbn)
  const forms = [isbn, parsed?.isbn13h, parsed?.isbn10, parsed?.isbn10h].filter(Boolean)
  const query = forms.map((f) => `bib.isbn adj "${f}"`).join(' or ')
  const params = new URLSearchParams({
    version: '1.2',
    operation: 'searchRetrieve',
    query,
    recordSchema: 'unimarcxchange',
    maximumRecords: '1',
  })

  let response: Response
  try {
    response = await fetch(`https://catalogue.bnf.fr/api/SRU?${params}`)
  } catch {
    throw new LookupError('BnF network error')
  }
  if (!response.ok) throw new LookupError(`BnF HTTP ${response.status}`)

  const xml = new DOMParser().parseFromString(await response.text(), 'text/xml')
  const field = (tag: string) =>
    [...xml.getElementsByTagName('mxc:datafield')].filter((f) => f.getAttribute('tag') === tag)
  const sub = (f: Element | undefined, code: string) =>
    [...(f?.getElementsByTagName('mxc:subfield') ?? [])]
      .find((s) => s.getAttribute('code') === code)
      ?.textContent?.trim() ?? null

  const title = field('200')[0]
  if (!sub(title, 'a')) return null

  const authors = [...field('700'), ...field('701'), ...field('702')].flatMap((f) => {
    const last = sub(f, 'a')
    const first = sub(f, 'b')
    return last ? [first ? `${first} ${last}` : last] : []
  })

  return {
    isbn,
    title: sub(title, 'a') ?? 'Titre inconnu',
    subtitle: sub(title, 'e'),
    tome: null,
    seriesId: null,
    authors,
    coverUrl: null,
    genre: normalizeGenre([]),
    synopsis: sub(field('330')[0], 'a'),
    rating: 0,
  }
}

interface OpenLibrarySearchDoc {
  title?: string
  subtitle?: string
  author_name?: string[]
  cover_i?: number
  subject?: string[]
}

/** Open Library search indexes ISBNs of editions the /isbn/ endpoint does not know. */
async function fetchFromOpenLibrarySearch(isbn: string): Promise<BookMetadata | null> {
  const fields = 'title,subtitle,author_name,cover_i,subject'
  const data = await getJson<{ docs?: OpenLibrarySearchDoc[] }>(
    `${OPEN_LIBRARY}/search.json?q=isbn:${isbn}&fields=${fields}&limit=1`,
  )
  const doc = data?.docs?.[0]
  if (!doc?.title) return null

  return {
    isbn,
    title: doc.title,
    subtitle: doc.subtitle ?? null,
    tome: null,
    seriesId: null,
    authors: doc.author_name ?? [],
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    genre: normalizeGenre(doc.subject ?? []),
    synopsis: null,
    rating: 0,
  }
}

/** Resolves to null only when every source answered "not found"; throws if a source failed and none found it. */
export async function fetchBookByIsbn(isbn: string): Promise<BookMetadata | null> {
  const failures = { count: 0 }
  const sources = [fetchFromOpenLibrary, fetchFromBnf, fetchFromOpenLibrarySearch, fetchFromGoogleBooks]

  for (const source of sources) {
    const book = await attempt(() => source(isbn), failures)
    if (book) return book
  }

  if (failures.count > 0) throw new LookupError('Lookup sources failed')
  return null
}
