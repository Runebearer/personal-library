import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../firebase/auth'
import { useTransition } from '../../context/TransitionContext'
import { useFavoritesShelf, FAVORITES_SHELF_NAME } from '../../hooks/useFavoritesShelf'
import { ViewModeToggle } from '../../components/ViewModeToggle'

const LobbyScene = lazy(() =>
  import('../../components/three/LobbyScene').then((m) => ({ default: m.LobbyScene })),
)

// 3D home: the lobby. Same entries as HomeClassic — favorites (the book on the desk),
// the library (left door) and logout (door behind).
export function Home3D() {
  const navigate = useNavigate()
  const { fadeAndNavigate } = useTransition()
  const { favoritesShelf, createFavoritesShelf } = useFavoritesShelf()

  async function handleSelectBook() {
    let shelfId = favoritesShelf?.id ?? null
    if (!shelfId) {
      if (!confirm(`Créer l'étagère « ${FAVORITES_SHELF_NAME} » ?`)) return
      shelfId = await createFavoritesShelf()
      if (!shelfId) return
    }
    const target = shelfId
    fadeAndNavigate(() => navigate(`/shelves/${target}`))
  }

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
        <LobbyScene
          onEnterLibrary={() => fadeAndNavigate(() => navigate('/library'))}
          onLogout={() => signOut()}
          onSelectBook={handleSelectBook}
        />
      </Suspense>
    </div>
  )
}
