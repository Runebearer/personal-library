import { Suspense } from 'react'
import { useLibraryTheme } from '../../three/ThemeContext'
import { SpriteFlipbook } from './SpriteFlipbook'

// theme.torchFlameTexture is a 5x2 sheet of 10 hand-painted frames.
const TORCH_COLUMNS = 5
const TORCH_ROWS = 2
const TORCH_FRAME_COUNT = 10
const TORCH_FPS = 10
const TORCH_WIDTH = 0.5
const TORCH_HEIGHT = 0.68

// A standalone animated flame sprite, for wall torches or other fixtures. Reads its texture
// from the theme like other 3D components, and renders nothing if none is configured.
export function Torch({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const theme = useLibraryTheme()

  if (!theme.torchFlameTexture) return null

  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={null}>
        <SpriteFlipbook
          url={theme.torchFlameTexture}
          columns={TORCH_COLUMNS}
          rows={TORCH_ROWS}
          frameCount={TORCH_FRAME_COUNT}
          fps={TORCH_FPS}
          width={TORCH_WIDTH}
          height={TORCH_HEIGHT}
          position={[0, TORCH_HEIGHT / 2, 0]}
        />
      </Suspense>
    </group>
  )
}
