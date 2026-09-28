import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTransition } from '../../context/TransitionContext'
import { ViewModeToggle } from '../../components/ViewModeToggle'
import { useShelves } from '../../hooks/useShelves'
import { useBooksByShelf } from '../../hooks/useBooksByShelf'
import type { ShelfPreview } from '../../hooks/useShelfBooks'
import { splitIntoBookcases } from '../../three/bookcaseLayout'
import type { LibraryHandover } from '../library/Library3D'
import type { Book } from '../../types'

// The library the back button zooms out to — preloaded so the crossfade into it doesn't wait
// on a network round trip.
const loadLibraryScene = () => import('../../components/three/LibraryScene')

const ShelfScene = lazy(() =>
  import('../../components/three/ShelfScene').then((m) => ({ default: m.ShelfScene })),
)

const overlayButtonClass =
  'rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow ring-1 ring-gray-200 backdrop-blur'

// 3D shelf view: close-up of the shelf's bookcase, full screen, inside the library room —
// so it needs the whole library (every shelf and its books), not just this shelf. Clicking
// a book opens its detail sheet (handled by ShelfPage, shared with the classic view).
// A shelf with more books than a bookcase holds spans several bookcases side by side; the
// one in view is `?meuble=N` in the URL, and arrows at the bottom slide to the others.
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
  const { fadeAndNavigate, crossfadeAndNavigate } = useTransition()
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    loadLibraryScene()
  }, [])
  const { shelves, loaded } = useShelves(preview?.shelves)
  const booksByShelf = useBooksByShelf(shelves, preview?.booksByShelf)
  const books = booksByShelf[shelfId]
  const bookcaseCount = books ? splitIntoBookcases(books).length : 1

  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = Number(searchParams.get('meuble') ?? '1') - 1
  const part = Number.isInteger(requested)
    ? Math.min(Math.max(requested, 0), bookcaseCount - 1)
    : 0

  // Back to the library: the close-up zooms out (ShelfScene), then its last frame melts
  // into the library, which opens facing this bookcase.
  function handleExited(snapshot: string) {
    const handover: LibraryHandover = {
      shelves,
      booksByShelf,
      returningFrom: { shelfId, part },
    }
    const go = () => navigate('/library', { state: { library: handover } })
    if (snapshot) crossfadeAndNavigate(snapshot, go)
    else fadeAndNavigate(go)
  }

  function showBookcase(next: number) {
    // replace: moving along the shelf isn't a new page in the history; keep the router
    // state (the preview data) so it stays available
    setSearchParams(next > 0 ? { meuble: String(next + 1) } : {}, {
      replace: true,
      state: location.state,
    })
  }

  return (
    <div className="relative">
      <div className="fixed inset-x-4 top-4 z-10 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExiting(true)}
          disabled={exiting}
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
          part={part}
          exiting={exiting}
          onExited={handleExited}
          onSelectBook={onSelectBook}
        />
      </Suspense>

      {bookcaseCount > 1 && !exiting && (
        <div className="fixed inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => showBookcase(part - 1)}
            disabled={part === 0}
            aria-label="Meuble précédent"
            className={`${overlayButtonClass} disabled:opacity-40`}
          >
            ‹
          </button>
          <span className={overlayButtonClass}>
            Meuble {part + 1} / {bookcaseCount}
          </span>
          <button
            type="button"
            onClick={() => showBookcase(part + 1)}
            disabled={part === bookcaseCount - 1}
            aria-label="Meuble suivant"
            className={`${overlayButtonClass} disabled:opacity-40`}
          >
            ›
          </button>
        </div>
      )}

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
