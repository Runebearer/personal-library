import { useTexture } from '@react-three/drei'
import { defaultTheme, type LibraryTheme } from './theme'

// Starts downloading every texture of the theme into drei's loader cache, so the next 3D
// scene finds them ready instead of suspending on them. Safe to call repeatedly: textures
// already loaded (or loading) aren't fetched again.
export function preloadThemeTextures(theme: LibraryTheme = defaultTheme) {
  for (const [key, value] of Object.entries(theme)) {
    if (key.endsWith('Texture') && typeof value === 'string') useTexture.preload(value)
  }
}
