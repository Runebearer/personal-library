import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Book, BookMetadata, Shelf } from '../types'

function shelvesRef(uid: string) {
  return collection(db, 'users', uid, 'shelves')
}

function booksRef(uid: string, shelfId: string) {
  return collection(db, 'users', uid, 'shelves', shelfId, 'books')
}

export function subscribeToShelves(uid: string, callback: (shelves: Shelf[]) => void) {
  const q = query(shelvesRef(uid), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name as string,
          createdAt: (data.createdAt as Timestamp | null)?.toMillis() ?? 0,
        }
      }),
    )
  })
}

export function createShelf(uid: string, name: string) {
  return addDoc(shelvesRef(uid), { name, createdAt: serverTimestamp() })
}

export function deleteShelf(uid: string, shelfId: string) {
  return deleteDoc(doc(db, 'users', uid, 'shelves', shelfId))
}

export function subscribeToBooks(
  uid: string,
  shelfId: string,
  callback: (books: Book[]) => void,
) {
  const q = query(booksRef(uid, shelfId), orderBy('addedAt', 'desc'))
  return onSnapshot(q, (snapshot) => {
    callback(
      snapshot.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          isbn: data.isbn as string,
          title: data.title as string,
          authors: (data.authors as string[]) ?? [],
          coverUrl: (data.coverUrl as string | null) ?? null,
          addedAt: (data.addedAt as Timestamp | null)?.toMillis() ?? 0,
        }
      }),
    )
  })
}

export function addBook(uid: string, shelfId: string, metadata: BookMetadata) {
  return addDoc(booksRef(uid, shelfId), {
    ...metadata,
    addedAt: serverTimestamp(),
  })
}

export function deleteBook(uid: string, shelfId: string, bookId: string) {
  return deleteDoc(doc(db, 'users', uid, 'shelves', shelfId, 'books', bookId))
}
