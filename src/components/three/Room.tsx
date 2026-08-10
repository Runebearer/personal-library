import { Suspense, useEffect } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'

type WallPlacement = { position: [number, number, number]; rotation: [number, number, number] }

function wallPlacements(size: number, height: number): WallPlacement[] {
  const half = size / 2
  return [
    { position: [0, height / 2, -half], rotation: [0, 0, 0] }, // front, faces +z
    { position: [0, height / 2, half], rotation: [0, Math.PI, 0] }, // back, faces -z
    { position: [-half, height / 2, 0], rotation: [0, Math.PI / 2, 0] }, // left, faces +x
    { position: [half, height / 2, 0], rotation: [0, -Math.PI / 2, 0] }, // right, faces -x
  ]
}

function PlainWalls({ size, height, color }: { size: number; height: number; color: string }) {
  return (
    <>
      {wallPlacements(size, height).map((wall, i) => (
        <mesh key={i} position={wall.position} rotation={wall.rotation}>
          <planeGeometry args={[size, height]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  )
}

function TexturedWalls({ size, height, url }: { size: number; height: number; url: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(size / 2, height / 2)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture, size, height])

  return (
    <>
      {wallPlacements(size, height).map((wall, i) => (
        <mesh key={i} position={wall.position} rotation={wall.rotation}>
          <planeGeometry args={[size, height]} />
          <meshStandardMaterial map={texture} />
        </mesh>
      ))}
    </>
  )
}

function PlainFloor({ size, color }: { size: number; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function TexturedFloor({ size, url }: { size: number; url: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(size / 2, size / 2)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture, size])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

function PlainCeiling({ size, height, color }: { size: number; height: number; color: string }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

function TexturedCeiling({ size, height, url }: { size: number; height: number; url: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(size / 2, size / 2)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture, size])

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  )
}

// A square room: floor, ceiling, four walls, all normals facing inward.
export function Room({ size = 6, height = 3 }: { size?: number; height?: number }) {
  const theme = useLibraryTheme()

  return (
    <group>
      {theme.floorTexture ? (
        <Suspense fallback={<PlainFloor size={size} color={theme.floorColor} />}>
          <TexturedFloor size={size} url={theme.floorTexture} />
        </Suspense>
      ) : (
        <PlainFloor size={size} color={theme.floorColor} />
      )}

      {theme.ceilingTexture ? (
        <Suspense fallback={<PlainCeiling size={size} height={height} color={theme.ceilingColor} />}>
          <TexturedCeiling size={size} height={height} url={theme.ceilingTexture} />
        </Suspense>
      ) : (
        <PlainCeiling size={size} height={height} color={theme.ceilingColor} />
      )}

      {theme.wallTexture ? (
        <Suspense fallback={<PlainWalls size={size} height={height} color={theme.wallColor} />}>
          <TexturedWalls size={size} height={height} url={theme.wallTexture} />
        </Suspense>
      ) : (
        <PlainWalls size={size} height={height} color={theme.wallColor} />
      )}
    </group>
  )
}
