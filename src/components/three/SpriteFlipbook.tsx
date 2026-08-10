import { useEffect, useMemo, useRef } from 'react'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const flipbookVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Samples one cell of the sprite sheet, picked each frame from JS via the frameOffset uniform.
const flipbookFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 cellSize;
  uniform vec2 frameOffset;
  varying vec2 vUv;

  void main() {
    // With flipY disabled on the texture, v runs top-to-bottom through the sheet — flip it
    // here so the plane's bottom edge samples each cell's bottom instead of its top, which
    // otherwise renders every frame upside down.
    vec2 cellUv = vec2(vUv.x, 1.0 - vUv.y);
    vec4 texColor = texture2D(map, cellUv * cellSize + frameOffset);
    if (texColor.a < 0.02) discard;
    gl_FragColor = texColor;
  }
`

// Unlit animated sprite sheet: plays a grid of pre-rendered frames as a flipbook loop, e.g.
// a hand-painted flame. Drives frameOffset by wall-clock time and calls invalidate() every
// tick, since the canvas otherwise only renders on demand and wouldn't animate on its own.
export function SpriteFlipbook({
  url,
  columns,
  rows,
  frameCount,
  fps,
  width,
  height,
  position = [0, 0, 0],
}: {
  url: string
  columns: number
  rows: number
  frameCount: number
  fps: number
  width: number
  height: number
  position?: [number, number, number]
}) {
  const texture = useTexture(url)
  const elapsed = useRef(0)
  const { invalidate } = useThree()

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.flipY = false
    texture.needsUpdate = true
  }, [texture])

  const uniforms = useMemo(
    () => ({
      map: { value: texture },
      cellSize: { value: new THREE.Vector2(1 / columns, 1 / rows) },
      frameOffset: { value: new THREE.Vector2(0, 0) },
    }),
    [texture, columns, rows],
  )

  useFrame((_, delta) => {
    elapsed.current += delta
    const frame = Math.floor(elapsed.current * fps) % frameCount
    const column = frame % columns
    const row = Math.floor(frame / columns)
    uniforms.frameOffset.value.set(column / columns, row / rows)
    invalidate()
  })

  return (
    <mesh position={position}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={flipbookVertexShader}
        fragmentShader={flipbookFragmentShader}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
