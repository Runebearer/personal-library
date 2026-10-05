import type { ReactNode } from 'react'
import { BookSearch } from './BookSearch'
import { ShelfManager } from './ShelfManager'

function Sheet({
  title,
  zIndex,
  scroll,
  onClose,
  children,
}: {
  title: string
  zIndex: string
  scroll?: boolean
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end bg-black/40 sm:items-center sm:justify-center`}>
      <div
        className={`flex w-full flex-col gap-2 rounded-t-2xl bg-gray-50 p-4 sm:max-w-md sm:rounded-2xl ${
          scroll ? 'max-h-[85vh] overflow-y-auto' : ''
        }`}
      >
        <p className="pb-2 text-center font-medium text-gray-900">{title}</p>
        {children}
        <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
          Fermer
        </button>
      </div>
    </div>
  )
}

// The library's two tools, shared by the classic and 3D views: searching the books, and
// creating / renaming / deleting shelves.
export function SearchSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Rechercher un livre" zIndex="z-40" onClose={onClose}>
      <BookSearch />
    </Sheet>
  )
}

export function ManageShelvesSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="Gérer les étagères" zIndex="z-50" scroll onClose={onClose}>
      <ShelfManager />
    </Sheet>
  )
}
