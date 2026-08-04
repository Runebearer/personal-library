export type ShelfMode = 'custom' | 'genre' | 'author' | 'title'

export interface Shelf {
  id: string
  name: string
  mode: ShelfMode
  genreFilter: string | null
  createdAt: number
}

export interface Book {
  id: string
  isbn: string
  title: string
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
  authors: string[]
  coverUrl: string | null
  genre: string | null
  synopsis: string | null
  rating: number
}
