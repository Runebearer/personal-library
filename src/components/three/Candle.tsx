import { Suspense, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'
import { Torch } from './Torch'

const CANDLE_HEIGHT = 0.6
const CANDLE_WIDTH = CANDLE_HEIGHT * (480 / 971)
// Fractions of empty transparent margin above/below the candlestick within its source
// image (measured from its alpha bounds) — without correcting for this the sprite's base
// wouldn't line up with the surface it's meant to stand on.
const TOP_PAD = 0.246
const BOTTOM_PAD = 0.242
const CONTENT_HEIGHT = CANDLE_HEIGHT * (1 - TOP_PAD - BOTTOM_PAD)
// The flame reuses the wall-torch sprite sheet, scaled down to a candle-sized wick flame.
const FLAME_SCALE = 0.13

function CandleSprite({ url }: { url: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
  }, [texture])

  return (
    <mesh position={[0, CANDLE_HEIGHT / 2 - BOTTOM_PAD * CANDLE_HEIGHT, 0]}>
      <planeGeometry args={[CANDLE_WIDTH, CANDLE_HEIGHT]} />
      <meshStandardMaterial map={texture} alphaTest={0.5} />
    </mesh>
  )
}

// A single candlestick prop with an animated flame at the wick. position is the point
// where its base sits, e.g. on a countertop.
export function Candle({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const theme = useLibraryTheme()

  if (!theme.candleTexture) return null

  return (
    <group position={position} rotation={rotation}>
      <Suspense fallback={null}>
        <CandleSprite url={theme.candleTexture} />
      </Suspense>
      <Torch position={[0, CONTENT_HEIGHT, 0.01]} scale={FLAME_SCALE} />
      <pointLight
        position={[0, CONTENT_HEIGHT, 0.01]}
        color={theme.fireplaceEmberColor}
        intensity={0.15}
        distance={1}
      />
    </group>
  )
}
