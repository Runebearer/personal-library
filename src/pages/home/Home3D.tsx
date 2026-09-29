import { lazy, Suspense, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../firebase/auth'
import { useTransition } from '../../context/TransitionContext'
import { useFavoritesShelf, FAVORITES_SHELF_NAME } from '../../hooks/useFavoritesShelf'
import { ViewModeToggle } from '../../components/ViewModeToggle'
import { loadLibraryScene, loadLobbyScene, loadShelfScene, preloadScenes } from '../scenes'

const LobbyScene = lazy(() => loadLobbyScene().then((m) => ({ default: m.LobbyScene })))

// 3D home: the lobby. Same entries as HomeClassic — favorites (the book on the desk),
// the library (left door) and logout (door behind).
export function Home3D() {
  const navigate = useNavigate()
  const { fadeAndNavigate } = useTransition()
  const { favoritesShelf, createFavoritesShelf } = useFavoritesShelf()

  // the library (door) and the favorites shelf (book) are one click away
  useEffect(() => {
    preloadScenes(loadLibraryScene, loadShelfScene)
  }, [])

  async function handleSelectBook() {
    let shelfId = favoritesShelf?.id ?? null
    if (!shelfId) {
      if (!confirm(`Créer l'étagère « ${FAVORITES_SHELF_NAME} » ?`)) return
      shelfId = await createFavoritesShelf()
      if (!shelfId) return
    }
    const target = shelfId
    fadeAndNavigate(() => navigate(`/shelves/${target}`), { waitForScene: true })
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
          onEnterLibrary={() => fadeAndNavigate(() => navigate('/library'), { waitForScene: true })}
          onLogout={() => signOut()}
          onSelectBook={handleSelectBook}
        />
      </Suspense>
    </div>
  )
}
