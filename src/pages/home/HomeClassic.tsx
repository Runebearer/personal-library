import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '../../firebase/auth'
import { useFavoritesShelf, FAVORITES_SHELF_NAME } from '../../hooks/useFavoritesShelf'
import { ViewModeToggle } from '../../components/ViewModeToggle'

const cardClass =
  'flex items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-gray-200'

// Classic home: the 2D counterpart of the 3D lobby (Home3D) — favorites, library, logout.
export function HomeClassic() {
  const navigate = useNavigate()
  const { favoritesShelf, loaded, createFavoritesShelf } = useFavoritesShelf()

  async function handleCreateFavorites() {
    const shelfId = await createFavoritesShelf()
    if (shelfId) navigate(`/shelves/${shelfId}`)
  }

  return (
    <div className="min-h-dvh bg-gray-50 pb-8">
      <header className="flex items-center justify-between px-4 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Accueil</h1>
        <ViewModeToggle />
      </header>

      <div className="flex flex-col gap-3 px-4">
        {favoritesShelf ? (
          <Link to={`/shelves/${favoritesShelf.id}`} className={cardClass}>
            <span className="font-medium text-gray-900">{FAVORITES_SHELF_NAME}</span>
            <span className="text-gray-400">›</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleCreateFavorites}
            disabled={!loaded}
            className={`${cardClass} text-left`}
          >
            <span className="font-medium text-gray-900">{FAVORITES_SHELF_NAME}</span>
            <span className="text-sm text-gray-500">Créer</span>
          </button>
        )}

        <Link to="/library" className={cardClass}>
          <span className="font-medium text-gray-900">La bibliothèque</span>
          <span className="text-gray-400">›</span>
        </Link>

        <button
          type="button"
          onClick={() => signOut()}
          className={`${cardClass} text-left`}
        >
          <span className="font-medium text-gray-500">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
