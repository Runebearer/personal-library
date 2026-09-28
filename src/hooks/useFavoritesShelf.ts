import { useShelves } from './useShelves'

export const FAVORITES_SHELF_NAME = 'Mes livres préférés'

// The "favorites" shelf the home pages point to. It is looked up (by name) in the live
// shelves list instead of being created as a side effect of navigating: the home pages show
// it when it exists and offer an explicit "create" action when it doesn't.
export function useFavoritesShelf() {
  const { shelves, loaded, create } = useShelves()
  const favoritesShelf = shelves.find((s) => s.name === FAVORITES_SHELF_NAME) ?? null

  async function createFavoritesShelf() {
    return create(FAVORITES_SHELF_NAME, 'custom')
  }

  return { favoritesShelf, loaded, createFavoritesShelf }
}
