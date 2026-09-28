import { useMemo } from 'react'
import * as THREE from 'three'
import { GLOW_RADIUS_STEPS, GLOW_WORLD_WIDTH, HOVER_GLOW } from '../../three/hoverGlow'

// Up to this many rectangles make up a silhouette (e.g. bookcase body + name plate).
const MAX_RECTS = 4

const vertexShader = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Same halo as Door's outline shader, but from an exact distance to a union of rectangles
// instead of a ray search through a texture's alpha: inside the silhouette is discarded,
// outside glows in GLOW_RADIUS_STEPS rings fading out over glowWidth.
const fragmentShader = /* glsl */ `
  uniform vec4 rects[${MAX_RECTS}]; // center.xy, halfSize.xy
  uniform int rectCount;
  uniform float glowWidth;
  uniform vec3 glowColor;
  varying vec2 vPos;

  float rectDistance(vec2 p, vec4 r) {
    vec2 d = abs(p - r.xy) - r.zw;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  void main() {
    float dist = 1e5;
    for (int i = 0; i < ${MAX_RECTS}; i++) {
      if (i >= rectCount) break;
      dist = min(dist, rectDistance(vPos, rects[i]));
    }
    if (dist <= 0.0 || dist > glowWidth) discard;

    float ring = ceil(dist / glowWidth * float(${GLOW_RADIUS_STEPS}));
    float glow = 1.0 - ring / float(${GLOW_RADIUS_STEPS});
    if (glow <= 0.0) discard;

    gl_FragColor = vec4(glowColor, glow);
  }
`

export type GlowRect = { center: [number, number]; size: [number, number] }

// Hover halo around a flat silhouette made of rectangles, drawn on a plane in the group's
// xy plane (place it at the object's front face). Excluded from raycasting so it never
// steals pointer events.
export function RectGlow({
  rects,
  position = [0, 0, 0],
}: {
  rects: GlowRect[]
  position?: [number, number, number]
}) {
  const { uniforms, planeCenter, planeSize } = useMemo(() => {
    const minX = Math.min(...rects.map((r) => r.center[0] - r.size[0] / 2)) - GLOW_WORLD_WIDTH
    const maxX = Math.max(...rects.map((r) => r.center[0] + r.size[0] / 2)) + GLOW_WORLD_WIDTH
    const minY = Math.min(...rects.map((r) => r.center[1] - r.size[1] / 2)) - GLOW_WORLD_WIDTH
    const maxY = Math.max(...rects.map((r) => r.center[1] + r.size[1] / 2)) + GLOW_WORLD_WIDTH
    const center: [number, number] = [(minX + maxX) / 2, (minY + maxY) / 2]

    // rect coordinates are made relative to the plane's center, where vPos is measured from
    const packed = Array.from({ length: MAX_RECTS }, (_, i) => {
      const r = rects[i]
      return r
        ? new THREE.Vector4(
            r.center[0] - center[0],
            r.center[1] - center[1],
            r.size[0] / 2,
            r.size[1] / 2,
          )
        : new THREE.Vector4()
    })

    return {
      planeCenter: center,
      planeSize: [maxX - minX, maxY - minY] as [number, number],
      uniforms: {
        rects: { value: packed },
        rectCount: { value: Math.min(rects.length, MAX_RECTS) },
        glowWidth: { value: GLOW_WORLD_WIDTH },
        glowColor: { value: new THREE.Color(HOVER_GLOW) },
      },
    }
  }, [rects])

  return (
    <mesh
      position={[position[0] + planeCenter[0], position[1] + planeCenter[1], position[2]]}
      raycast={() => null}
    >
      <planeGeometry args={planeSize} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}
