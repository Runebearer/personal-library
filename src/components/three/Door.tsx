import { Suspense, useEffect, useMemo, useState } from 'react'
import { Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useLibraryTheme } from '../../three/ThemeContext'
import type { LibraryTheme } from '../../three/theme'

const DOOR_HEIGHT = 2.1
// The door texture bakes in its own stone arch, so geometry must match its aspect ratio.
const DOOR_TEXTURE_ASPECT = 512 / 917
const DOOR_WIDTH = DOOR_HEIGHT * DOOR_TEXTURE_ASPECT

const HOVER_GLOW = '#fdf6e3'

// How far, in source-texture texels, the glow extends past the door's alpha silhouette.
// Wide/dense enough to bridge gaps between separated details (e.g. scattered rubble at
// the door's base) that a tighter search would miss and leave unlit.
const GLOW_WIDTH_TEXELS = 22
const GLOW_DIRECTIONS = 20
const GLOW_RADIUS_STEPS = 14

// The glow mesh is enlarged beyond the door's own bounds (see uvScale below) so the halo
// has room to render past texture edges the artwork touches, e.g. the rubble at the door's
// foot. uvScale maps the plane's 0..1 UV down to the door texture's original 0..1 footprint,
// centered, leaving the border strip at uv < 0 or uv > 1.
const outlineVertexShader = /* glsl */ `
  uniform vec2 uvScale;
  varying vec2 vUv;
  void main() {
    vUv = (uv - 0.5) * uvScale + 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// For each transparent fragment, casts short rays outward and measures distance to the
// nearest opaque texel. Nearby edges glow bright, fading out over GLOW_WIDTH_TEXELS —
// tracing the texture's alpha cutout with a soft falloff instead of a hard line.
// Out-of-bounds UVs are treated as transparent rather than clamped to the edge texel, so the
// halo doesn't get smeared into a solid bar where the artwork touches the texture's border.
const outlineFragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 glowColor;
  uniform vec2 texelSize;
  varying vec2 vUv;

  float sampleAlpha(vec2 uv) {
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
    return texture2D(map, uv).a;
  }

  void main() {
    float centerAlpha = sampleAlpha(vUv);
    if (centerAlpha > 0.5) discard;

    float glow = 0.0;
    for (int d = 0; d < ${GLOW_DIRECTIONS}; d++) {
      float angle = (float(d) / float(${GLOW_DIRECTIONS})) * 6.28318530718;
      vec2 dir = vec2(cos(angle), sin(angle));
      for (int r = 1; r <= ${GLOW_RADIUS_STEPS}; r++) {
        float dist = float(r) / float(${GLOW_RADIUS_STEPS}) * ${GLOW_WIDTH_TEXELS}.0;
        vec2 offset = dir * texelSize * dist;
        if (sampleAlpha(vUv + offset) > 0.5) {
          glow = max(glow, 1.0 - float(r) / float(${GLOW_RADIUS_STEPS}));
          break;
        }
      }
    }
    if (glow <= 0.0) discard;

    gl_FragColor = vec4(glowColor, glow);
  }
`

function PlainDoorMaterial({ theme, hovered }: { theme: LibraryTheme; hovered: boolean }) {
  return (
    <meshStandardMaterial
      color={theme.doorColor}
      emissive={hovered ? HOVER_GLOW : '#000000'}
      emissiveIntensity={hovered ? 0.4 : 0}
    />
  )
}

function TexturedDoorMaterial({ url }: { url: string }) {
  const texture = useTexture(url)

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
  }, [texture])

  return <meshStandardMaterial map={texture} alphaTest={0.5} />
}

// Sits just in front of the door mesh and glows along its alpha silhouette on hover.
// Excluded from raycasting so it never steals pointer events from the door mesh behind it.
function DoorOutlineGlow({ url }: { url: string }) {
  const texture = useTexture(url)

  const { uniforms, geometrySize } = useMemo(() => {
    const image = texture.image as HTMLImageElement
    const texelSize = new THREE.Vector2(1 / image.width, 1 / image.height)
    // Margin, in world units, matching the glow's reach in texels — gives the halo room to
    // render even where the artwork touches the texture's own edge.
    const marginX = GLOW_WIDTH_TEXELS * texelSize.x * DOOR_WIDTH
    const marginY = GLOW_WIDTH_TEXELS * texelSize.y * DOOR_HEIGHT
    const width = DOOR_WIDTH + marginX * 2
    const height = DOOR_HEIGHT + marginY * 2

    return {
      geometrySize: [width, height] as [number, number],
      uniforms: {
        map: { value: texture },
        glowColor: { value: new THREE.Color(HOVER_GLOW) },
        texelSize: { value: texelSize },
        uvScale: { value: new THREE.Vector2(width / DOOR_WIDTH, height / DOOR_HEIGHT) },
      },
    }
  }, [texture])

  return (
    <mesh position={[0, DOOR_HEIGHT / 2, 0.031]} raycast={() => null}>
      <planeGeometry args={geometrySize} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={outlineVertexShader}
        fragmentShader={outlineFragmentShader}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

export function Door({
  position,
  rotation = [0, 0, 0],
  label,
  onSelect,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  label: string
  onSelect: () => void
}) {
  const theme = useLibraryTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <group position={position} rotation={rotation}>
      <mesh
        position={[0, DOOR_HEIGHT / 2, 0.03]}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[DOOR_WIDTH, DOOR_HEIGHT]} />
        {theme.doorTexture ? (
          <Suspense fallback={<PlainDoorMaterial theme={theme} hovered={hovered} />}>
            <TexturedDoorMaterial url={theme.doorTexture} />
          </Suspense>
        ) : (
          <PlainDoorMaterial theme={theme} hovered={hovered} />
        )}
      </mesh>

      {hovered && theme.doorTexture && (
        <Suspense fallback={null}>
          <DoorOutlineGlow url={theme.doorTexture} />
        </Suspense>
      )}

      <Html
        position={[0, DOOR_HEIGHT + 0.15, 0.1]}
        center
        distanceFactor={6}
        style={{ pointerEvents: 'none' }}
      >
        <span
          className="whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs font-medium shadow-sm"
          style={{ color: theme.labelColor }}
        >
          {label}
        </span>
      </Html>
    </group>
  )
}
