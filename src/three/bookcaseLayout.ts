import type { Book } from '../types'
import { groupBySeries } from '../lib/series'

// Bookcase dimensions and how books are shelved in it — plain geometry, no three.js, so
// pages can know how many bookcases a shelf needs without loading the 3D bundle.
export const BOOKCASE_WIDTH = 1.2
export const BOOKCASE_HEIGHT = 2.1
export const BOOKCASE_DEPTH = 0.32
export const PANEL = 0.04 // thickness of every board
export const ROWS = 5
export const ROW_PITCH = (BOOKCASE_HEIGHT - PANEL) / ROWS
export const INNER_WIDTH = BOOKCASE_WIDTH - PANEL * 2
const BOOK_GAP = 0.002
// Enlarges every shelved book (thickness and height), and with it the series name on the spine.
const BOOK_SCALE = 1.15
// Spines thinner than this can't hold a readable title, so no book goes below it (the
// width "Year One" had when it was picked).
const MIN_BOOK_THICKNESS = 0.05865

// Every book is drawn from one instanced mesh, so this caps what a bookcase can show.
export const MAX_BOOKS = 200

// Cheap deterministic hash so a book keeps the same color/size across renders and devices.
function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type BookInstance = {
  book: Book
  position: [number, number, number]
  size: [number, number, number]
  color: string
}

// Lays the books out left to right, row by row from the top, spines facing +z. Books
// that don't fit in the ROWS rows are left off.
// seriesColors: a series' own spine color (by series id), which wins over the palette.
export function layoutBooks(
  books: Book[],
  palette: string[],
  seriesColors: Record<string, string | null> = {},
): BookInstance[] {
  const instances: BookInstance[] = []
  let row = 0
  let x = -INNER_WIDTH / 2

  for (const book of groupBySeries(books)) {
    if (instances.length >= MAX_BOOKS) break
    // a series shares one look (size and color), so its volumes match on the shelf
    const h = hash(book.seriesId ?? book.id)
    const thickness = Math.max(
      MIN_BOOK_THICKNESS,
      (0.03 + ((h >>> 3) % 26) / 1000) * BOOK_SCALE,
    ) // 0.0587–0.063
    const height = (0.22 + ((h >>> 8) % 9) / 100) * BOOK_SCALE // 0.25–0.35
    const depth = 0.16 + ((h >>> 13) % 5) / 100 // 0.16–0.20

    if (x + thickness > INNER_WIDTH / 2) {
      row++
      x = -INNER_WIDTH / 2
    }
    if (row >= ROWS) break

    // row 0 is the top compartment
    const floorY = (ROWS - 1 - row) * ROW_PITCH + PANEL
    instances.push({
      book,
      position: [x + thickness / 2, floorY + height / 2, BOOKCASE_DEPTH / 2 - depth / 2 - 0.02],
      size: [thickness, height, depth],
      color: (book.seriesId && seriesColors[book.seriesId]) || palette[h % palette.length],
    })
    x += thickness + BOOK_GAP
  }

  return instances
}

// Splits a shelf's books (in display order) across as many bookcases as they need: each
// bookcase takes the books that fit in it, the rest overflow into the next one. Always at
// least one (possibly empty) bookcase.
export function splitIntoBookcases(books: Book[]): Book[][] {
  const bookcases: Book[][] = []
  let rest = groupBySeries(books)
  do {
    // palette doesn't matter here, only how many books fit
    const fit = Math.max(1, layoutBooks(rest, ['']).length)
    bookcases.push(rest.slice(0, fit))
    rest = rest.slice(fit)
  } while (rest.length > 0)
  return bookcases
}
