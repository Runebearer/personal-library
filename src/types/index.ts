export type ShelfMode = 'custom' | 'genre' | 'author' | 'title'

export interface Shelf {
  id: string
  name: string
  mode: ShelfMode
  genreFilter: string | null
  createdAt: number
}

// A series of books (e.g. a manga's volumes), shared across shelves. Books point to it by id.
export interface Series {
  id: string
  name: string
  // spine color of its volumes (#rrggbb); null = picked from the theme
  color: string | null
  createdAt: number
}

export interface Book {
  id: string
  isbn: string
  title: string
  subtitle: string | null
  tome: string | null
  seriesId: string | null
  authors: string[]
  coverUrl: string | null
  genre: string | null
  synopsis: string | null
  rating: number
  addedAt: number
}

export interface BookMetadata {
  isbn: string
  title: string
  subtitle: string | null
  tome: string | null
  seriesId: string | null
  authors: string[]
  coverUrl: string | null
  genre: string | null
  synopsis: string | null
  rating: number
}
