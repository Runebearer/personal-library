import { useEffect, useState } from 'react'
import { subscribeToShelves } from '../firebase/firestore'
import type { Shelf } from '../types'

export function MoveBookModal({
  uid,
  currentShelfId,
  onSelect,
  onClose,
}: {
  uid: string
  currentShelfId: string
  onSelect: (shelfId: string) => void
  onClose: () => void
}) {
  const [shelves, setShelves] = useState<Shelf[]>([])

  useEffect(() => subscribeToShelves(uid, setShelves), [uid])

  const otherShelves = shelves.filter((shelf) => shelf.id !== currentShelfId)

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
      <div className="flex max-h-[80vh] w-full flex-col gap-2 overflow-y-auto rounded-t-2xl bg-white p-4 sm:max-w-sm sm:rounded-2xl">
        <p className="text-center font-medium text-gray-900">Déplacer vers…</p>

        {otherShelves.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">
            Aucune autre étagère disponible.
          </p>
        )}

        {otherShelves.map((shelf) => (
          <button
            key={shelf.id}
            type="button"
            onClick={() => onSelect(shelf.id)}
            className="rounded-lg px-3 py-2 text-left text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50"
          >
            {shelf.name}
          </button>
        ))}

        <button type="button" onClick={onClose} className="rounded-lg py-2 text-gray-500">
          Annuler
        </button>
      </div>
    </div>
  )
}
