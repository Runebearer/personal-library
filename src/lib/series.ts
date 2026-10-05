import type { Book } from '../types'

// Books of a same series are shelved side by side, in tome order. The series takes the place
// of its first book in `books` (display order); books without a series keep their place.
// Stable and idempotent, so re-ordering a slice of an already ordered list changes nothing.
export function groupBySeries(books: Book[]): Book[] {
  const series = new Map<string, Book[]>()
  for (const book of books) {
    if (!book.seriesId) continue
    const members = series.get(book.seriesId)
    if (members) members.push(book)
    else series.set(book.seriesId, [book])
  }
  for (const members of series.values()) {
    members.sort((a, b) => tomeNumber(a) - tomeNumber(b))
  }

  const ordered: Book[] = []
  const placed = new Set<string>()
  for (const book of books) {
    if (!book.seriesId) {
      ordered.push(book)
    } else if (!placed.has(book.seriesId)) {
      placed.add(book.seriesId)
      ordered.push(...series.get(book.seriesId)!)
    }
  }
  return ordered
}

// Tome is free text ("2", "Tome 2", "10"): sort on its first number, unnumbered ones last.
function tomeNumber(book: Book) {
  const match = book.tome?.match(/\d+(?:[.,]\d+)?/)
  return match ? Number(match[0].replace(',', '.')) : Number.POSITIVE_INFINITY
}
