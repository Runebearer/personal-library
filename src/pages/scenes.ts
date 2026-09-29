// The 3D scenes, loaded on demand (dynamic imports only, so three.js stays out of the
// classic pages' bundle), plus a way to warm them up before navigating to them.
export const loadLobbyScene = () => import('../components/three/LobbyScene')
export const loadLibraryScene = () => import('../components/three/LibraryScene')
export const loadShelfScene = () => import('../components/three/ShelfScene')

// Preloads the code of the scenes a page can lead to, and every theme texture, so the
// destination is drawn almost as soon as the transition reaches it. Fire and forget.
export function preloadScenes(...loaders: (() => Promise<unknown>)[]) {
  for (const load of loaders) load()
  import('../three/preloadTextures').then((m) => m.preloadThemeTextures())
}
