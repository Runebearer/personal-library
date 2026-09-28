import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTransition } from '../../context/TransitionContext'
import { useShelves } from '../../hooks/useShelves'
import { useBooksByShelf } from '../../hooks/useBooksByShelf'
import { ShelfManager } from '../../components/ShelfManager'
import { ViewModeToggle } from '../../components/ViewModeToggle'
import type { BookcaseRef } from '../../components/three/LibraryScene'
import type { Book, Shelf } from '../../types'

// Handed over through the router state by a shelf close-up zooming back out: the library
// data (so the room opens filled) and the bookcase it comes from (so it opens facing it).
export type LibraryHandover = {
  shelves: Shelf[]
  booksByShelf: Record<string, Book[]>
  returningFrom: BookcaseRef
}

// The shelf close-up the bookcases lead to — preloaded so the crossfade into it doesn't
// wait on a network round trip.
const loadShelfScene = () => import('../../components/three/ShelfScene')

const LibraryScene = lazy(() =>
  import('../../components/three/LibraryScene').then((m) => ({ default: m.LibraryScene })),
)

const overlayButtonClass =
  'rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-700 shadow ring-1 ring-gray-200 backdrop-blur'

// 3D library: the room of bookcases (one per shelf). Creating / renaming / deleting shelves
// goes through the same ShelfManager as the classic view, in a sheet over the scene.
export function Library3D() {
  const navigate = useNavigate()
  const { fadeAndNavigate, crossfadeAndNavigate } = useTransition()
  const location = useLocation()
  const handover = (location.state as { library?: LibraryHandover } | null)?.library
  const { shelves, loaded } = useShelves(handover?.shelves)
  const booksByShelf = useBooksByShelf(shelves, handover?.booksByShelf)
  const [managing, setManaging] = useState(false)

  useEffect(() => {
    loadShelfScene()
  }, [])

  return (
    <div className="relative">
      <ViewModeToggle className="fixed right-4 top-4 z-10" />

      <Suspense
        fallback={
          <div className="flex h-dvh items-center justify-center bg-gray-900 text-sm text-gray-400">
            Chargement…
          </div>
        }
      >
        <LibraryScene
          shelves={shelves}
          booksByShelf={booksByShelf}
          returningFrom={handover?.returningFrom}
          onSelectShelf={(shelf, part, snapshot) =>
            crossfadeAndNavigate(snapshot, () =>
              // hand the shelf and its books over so the close-up opens already filled
              navigate(`/shelves/${shelf.id}${part > 0 ? `?meuble=${part + 1}` : ''}`, {
                state: {
                  preview: { shelf, books: booksByShelf[shelf.id] ?? [], shelves, booksByShelf },
                },
              }),
            )
          }
          onExit={() => fadeAndNavigate(() => navigate('/'))}
        />
      </Suspense>

      {loaded && shelves.length === 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-10 flex justify-center px-6">
          <p className="rounded-xl bg-white/90 px-4 py-3 text-center text-sm text-gray-600 shadow backdrop-blur">
            La bibliothèque est vide. Créez une étagère pour y installer un premier meuble.
          </p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-6 z-10 flex justify-center">
        <button type="button" onClick={() => setManaging(true)} className={overlayButtonClass}>
          Gérer les étagères
        </button>
      </div>

      {managing && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center">
          <div className="flex max-h-[85vh] w-full flex-col gap-2 overflow-y-auto rounded-t-2xl bg-gray-50 p-4 sm:max-w-md sm:rounded-2xl">
            <p className="pb-2 text-center font-medium text-gray-900">Mes étagères</p>
            <ShelfManager />
            <button
              type="button"
              onClick={() => setManaging(false)}
              className="rounded-lg py-2 text-gray-500"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
