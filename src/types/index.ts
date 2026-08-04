export interface Shelf {
  id: string
  name: string
  createdAt: number
}

export interface Book {
  id: string
  isbn: string
  title: string
  authors: string[]
  coverUrl: string | null
  addedAt: number
}

export interface BookMetadata {
  isbn: string
  title: string
  authors: string[]
  coverUrl: string | null
}
