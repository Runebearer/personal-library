import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { TransitionProvider } from './context/TransitionContext'
import { ViewModeProvider, useViewMode } from './context/ViewModeContext'
import { isFirebaseConfigured } from './firebase/config'
import { LoginPage } from './pages/LoginPage'
import { VestibulePage } from './pages/VestibulePage'
import { ShelvesPage } from './pages/ShelvesPage'
import { ShelfDetailPage } from './pages/ShelfDetailPage'

function MissingFirebaseConfig() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
      <p className="text-lg font-medium text-gray-900">Firebase n'est pas configuré</p>
      <p className="max-w-sm text-sm text-gray-500">
        Copiez <code className="rounded bg-gray-200 px-1">.env.example</code> en{' '}
        <code className="rounded bg-gray-200 px-1">.env.local</code> et renseignez la config de
        votre projet Firebase (Auth + Firestore), puis relancez le serveur de développement.
      </p>
    </div>
  )
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 text-gray-400">
        Chargement…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function RedirectIfAuthed({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50 text-gray-400">
        Chargement…
      </div>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return children
}

function HomeRoute() {
  const { viewMode } = useViewMode()
  return viewMode === '3d' ? <VestibulePage /> : <ShelvesPage />
}

export function App() {
  if (!isFirebaseConfigured) {
    return <MissingFirebaseConfig />
  }

  return (
    <TransitionProvider>
      <ViewModeProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthed>
                <LoginPage />
              </RedirectIfAuthed>
            }
          />
          <Route
            path="/"
            element={
              <RequireAuth>
                <HomeRoute />
              </RequireAuth>
            }
          />
          <Route
            path="/library"
            element={
              <RequireAuth>
                <ShelvesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/shelves/:shelfId"
            element={
              <RequireAuth>
                <ShelfDetailPage />
              </RequireAuth>
            }
          />
        </Routes>
      </ViewModeProvider>
    </TransitionProvider>
  )
}
