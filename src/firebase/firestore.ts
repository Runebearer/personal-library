import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import type { Book, BookMetadata, Shelf, ShelfMode } from '../types'

function shelvesRef(uid: string) {
  return collection(db, 'users', uid, 'shelves')
}

function shelfDocRef(uid: string, shelfId: string) {
  return doc(db, 'users', uid, 'shelves', shelfId)
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
          mode: (data.mode as ShelfMode) ?? 'custom',
          createdAt: (data.createdAt as Timestamp | null)?.toMillis() ?? 0,
        }
      }),
    )
  })
}

export function subscribeToShelf(
  uid: string,
  shelfId: string,
  callback: (shelf: Shelf | null) => void,
) {
  return onSnapshot(shelfDocRef(uid, shelfId), (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    const data = snapshot.data()
    callback({
      id: snapshot.id,
      name: data.name as string,
      mode: (data.mode as ShelfMode) ?? 'custom',
      createdAt: (data.createdAt as Timestamp | null)?.toMillis() ?? 0,
    })
  })
}

export function createShelf(uid: string, name: string, mode: ShelfMode) {
  return addDoc(shelvesRef(uid), { name, mode, createdAt: serverTimestamp() })
}

export function renameShelf(uid: string, shelfId: string, name: string) {
  return updateDoc(shelfDocRef(uid, shelfId), { name })
}

export async function deleteShelf(uid: string, shelfId: string) {
  const booksSnapshot = await getDocs(booksRef(uid, shelfId))
  const batch = writeBatch(db)
  booksSnapshot.docs.forEach((bookDoc) => batch.delete(bookDoc.ref))
  batch.delete(shelfDocRef(uid, shelfId))
  await batch.commit()
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
          genre: (data.genre as string | null) ?? null,
          synopsis: (data.synopsis as string | null) ?? null,
          rating: (data.rating as number) ?? 0,
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

export function updateBook(
  uid: string,
  shelfId: string,
  bookId: string,
  patch: Partial<Pick<Book, 'genre' | 'synopsis' | 'rating'>>,
) {
  return updateDoc(doc(db, 'users', uid, 'shelves', shelfId, 'books', bookId), patch)
}

export function deleteBook(uid: string, shelfId: string, bookId: string) {
  return deleteDoc(doc(db, 'users', uid, 'shelves', shelfId, 'books', bookId))
}
