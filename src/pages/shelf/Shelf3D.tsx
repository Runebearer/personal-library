import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransition } from '../../context/TransitionContext'
import { ViewModeToggle } from '../../components/ViewModeToggle'
import { useShelves } from '../../hooks/useShelves'
import { useBooksByShelf } from '../../hooks/useBooksByShelf'
import type { ShelfPreview } from '../../hooks/useShelfBooks'
import type { Book } from '../../types'

const ShelfScene = lazy(() =>
  import('../../components/three/ShelfScene').then((m) => ({ default: m.ShelfScene })),
)

const overlayButtonClass =
  'rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow ring-1 ring-gray-200 backdrop-blur'

// 3D shelf view: close-up of the shelf's bookcase, full screen, inside the library room —
// so it needs the whole library (every shelf and its books), not just this shelf. Clicking
// a book opens its detail sheet (handled by ShelfPage, shared with the classic view).
export function Shelf3D({
  shelfId,
  preview,
  onSelectBook,
}: {
  shelfId: string
  preview?: ShelfPreview
  onSelectBook: (book: Book) => void
}) {
  const navigate = useNavigate()
  const { fadeAndNavigate } = useTransition()
  const { shelves, loaded } = useShelves(preview?.shelves)
  const booksByShelf = useBooksByShelf(shelves, preview?.booksByShelf)
  const books = booksByShelf[shelfId]

  return (
    <div className="relative">
      <div className="fixed inset-x-4 top-4 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => fadeAndNavigate(() => navigate('/library'))}
          className={overlayButtonClass}
        >
          ‹ Bibliothèque
        </button>
        <ViewModeToggle />
      </div>

      <Suspense
        fallback={
          <div className="flex h-dvh items-center justify-center bg-gray-900 text-sm text-gray-400">
            Chargement…
          </div>
        }
      >
        <ShelfScene
          shelves={shelves}
          booksByShelf={booksByShelf}
          shelfId={shelfId}
          onSelectBook={onSelectBook}
        />
      </Suspense>

      {loaded && books?.length === 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-10 flex justify-center px-6">
          <p className="rounded-xl bg-white/90 px-4 py-3 text-center text-sm text-gray-600 shadow backdrop-blur">
            Aucun livre sur cette étagère. Scannez un code-barres pour en ajouter un.
          </p>
        </div>
      )}
    </div>
  )
}
