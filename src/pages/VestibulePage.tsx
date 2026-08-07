import { lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../firebase/auth'
import { useTransition } from '../context/TransitionContext'

const LobbyScene = lazy(() =>
  import('../components/three/LobbyScene').then((m) => ({ default: m.LobbyScene })),
)

export function VestibulePage() {
  const navigate = useNavigate()
  const { fadeAndNavigate } = useTransition()

  return (
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
      />
    </Suspense>
  )
}
