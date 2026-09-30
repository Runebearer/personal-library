import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  type QueryDocumentSnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from './config'
import type { Book, BookMetadata, Series, Shelf, ShelfMode } from '../types'

function shelvesRef(uid: string) {
  return collection(db, 'users', uid, 'shelves')
}

function shelfDocRef(uid: string, shelfId: string) {
  return doc(db, 'users', uid, 'shelves', shelfId)
}

function seriesRef(uid: string) {
  return collection(db, 'users', uid, 'series')
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
          genreFilter: (data.genreFilter as string | null) ?? null,
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
      genreFilter: (data.genreFilter as string | null) ?? null,
      createdAt: (data.createdAt as Timestamp | null)?.toMillis() ?? 0,
    })
  })
}

export function createShelf(
  uid: string,
  name: string,
  mode: ShelfMode,
  genreFilter: string | null = null,
) {
  return addDoc(shelvesRef(uid), { name, mode, genreFilter, createdAt: serverTimestamp() })
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

function toBook(d: QueryDocumentSnapshot): Book {
  const data = d.data()
  return {
    id: d.id,
    isbn: data.isbn as string,
    title: data.title as string,
    subtitle: (data.subtitle as string | null) ?? null,
    tome: (data.tome as string | null) ?? null,
    seriesId: (data.seriesId as string | null) ?? null,
    authors: (data.authors as string[]) ?? [],
    coverUrl: (data.coverUrl as string | null) ?? null,
    genre: (data.genre as string | null) ?? null,
    synopsis: (data.synopsis as string | null) ?? null,
    rating: (data.rating as number) ?? 0,
    addedAt: (data.addedAt as Timestamp | null)?.toMillis() ?? 0,
  }
}

export function subscribeToBooks(
  uid: string,
  shelfId: string,
  callback: (books: Book[]) => void,
) {
  const q = query(booksRef(uid, shelfId), orderBy('addedAt', 'desc'))
  return onSnapshot(q, (snapshot) => callback(snapshot.docs.map(toBook)))
}

// One-off read of every book of the given shelves, unfiltered (genre shelves included)
export async function fetchBooksOfShelves(
  uid: string,
  shelfIds: string[],
): Promise<{ shelfId: string; book: Book }[]> {
  const snapshots = await Promise.all(shelfIds.map((id) => getDocs(booksRef(uid, id))))
  return snapshots.flatMap((snapshot, i) =>
    snapshot.docs.map((d) => ({ shelfId: shelfIds[i], book: toBook(d) })),
  )
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
  patch: Partial<
    Pick<
      Book,
      'title' | 'subtitle' | 'tome' | 'seriesId' | 'authors' | 'genre' | 'synopsis' | 'rating'
    >
  >,
) {
  return updateDoc(doc(db, 'users', uid, 'shelves', shelfId, 'books', bookId), patch)
}

export function deleteBook(uid: string, shelfId: string, bookId: string) {
  return deleteDoc(doc(db, 'users', uid, 'shelves', shelfId, 'books', bookId))
}

export async function moveBook(
  uid: string,
  fromShelfId: string,
  bookId: string,
  toShelfId: string,
) {
  const fromRef = doc(db, 'users', uid, 'shelves', fromShelfId, 'books', bookId)
  const snapshot = await getDoc(fromRef)
  if (!snapshot.exists()) return
  const data = snapshot.data()

  const batch = writeBatch(db)
  batch.set(doc(booksRef(uid, toShelfId)), {
    isbn: data.isbn,
    title: data.title,
    subtitle: data.subtitle ?? null,
    tome: data.tome ?? null,
    seriesId: data.seriesId ?? null,
    authors: data.authors,
    coverUrl: data.coverUrl,
    genre: data.genre,
    synopsis: data.synopsis,
    rating: data.rating,
    addedAt: serverTimestamp(),
  })
  batch.delete(fromRef)
  await batch.commit()
}

export function subscribeToSeries(uid: string, callback: (series: Series[]) => void) {
  const q = query(seriesRef(uid), orderBy('name'))
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

export async function createSeries(uid: string, name: string): Promise<string> {
  const created = await addDoc(seriesRef(uid), { name, createdAt: serverTimestamp() })
  return created.id
}
