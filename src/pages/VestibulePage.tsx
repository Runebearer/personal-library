import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../firebase/auth'
import { getOrCreateShelfByName } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { useTransition } from '../context/TransitionContext'
import { ViewModeToggle } from '../components/ViewModeToggle'

const LobbyScene = lazy(() =>
  import('../components/three/LobbyScene').then((m) => ({ default: m.LobbyScene })),
)

const FAVORITES_SHELF_NAME = 'Mes livres préférés'

export function VestibulePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fadeAndNavigate } = useTransition()

  async function handleSelectBook() {
    if (!user) return
    const shelfId = await getOrCreateShelfByName(user.uid, FAVORITES_SHELF_NAME, 'custom')
    fadeAndNavigate(() => navigate(`/shelves/${shelfId}`))
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
