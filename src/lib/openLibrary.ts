import type { BookMetadata } from '../types'

interface OpenLibraryEntry {
  title?: string
  authors?: { name: string }[]
  cover?: { small?: string; medium?: string; large?: string }
  subjects?: { name: string }[]
  excerpts?: { text: string }[]
  notes?: string
}

export async function fetchBookByIsbn(isbn: string): Promise<BookMetadata | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Open Library request failed: ${response.status}`)
  }

  const data = (await response.json()) as Record<string, OpenLibraryEntry>
  const entry = data[`ISBN:${isbn}`]
  if (!entry) return null

  return {
    isbn,
    title: entry.title ?? 'Titre inconnu',
    authors: entry.authors?.map((a) => a.name) ?? [],
    coverUrl: entry.cover?.medium ?? entry.cover?.large ?? entry.cover?.small ?? null,
    genre: entry.subjects?.[0]?.name ?? null,
    synopsis: entry.excerpts?.[0]?.text ?? entry.notes ?? null,
    rating: 0,
  }
}
