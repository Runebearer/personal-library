import { useLibraryTheme } from '../../three/ThemeContext'
import { Torch } from './Torch'

// A wrought-iron lantern cage bracketed to a wall, holding the shared flame sprite —
// built from primitives like Fireplace, since there's no lantern texture asset.
const FLAME_SCALE = 0.55
// Distance from the cage's vertical axis to each corner post's center.
const CAGE_HALF = 0.13
const POST_THICKNESS = 0.02
const POST_HEIGHT = 0.42
const BASE_THICKNESS = 0.04
const TOP_PLATE_THICKNESS = 0.03
const ROOF_HEIGHT = 0.16
// How far the lantern stands out from the wall, mounted on a short bracket arm.
const BRACKET_DEPTH = 0.16

// Base and top plates share the posts' footprint so their edges land flush against the
// posts' outer faces instead of leaving a gap between the socle and the uprights.
const PLATE_SIZE = CAGE_HALF * 2 + POST_THICKNESS

const BASE_CENTER_Y = 0.06
const POST_BOTTOM_Y = BASE_CENTER_Y + BASE_THICKNESS / 2
const POST_CENTER_Y = POST_BOTTOM_Y + POST_HEIGHT / 2
const POST_TOP_Y = POST_BOTTOM_Y + POST_HEIGHT
const TOP_PLATE_CENTER_Y = POST_TOP_Y + TOP_PLATE_THICKNESS / 2
const ROOF_CENTER_Y = TOP_PLATE_CENTER_Y + TOP_PLATE_THICKNESS / 2 + ROOF_HEIGHT / 2
const FLAME_Y = POST_BOTTOM_Y + 0.03

const CAGE_CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
]

// A standalone wall-mounted torch: bracket + lantern cage + the shared flame sprite.
// position/rotation follow the same wall-mount convention as Door and Fireplace.
export function WallTorch({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  position?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const theme = useLibraryTheme()
  const metal = theme.doorFrameColor

  return (
    <group position={position} rotation={rotation}>
      {/* bracket arm, emerging from the wall to carry the base plate */}
      <mesh position={[0, BASE_CENTER_Y, BRACKET_DEPTH / 2]}>
        <boxGeometry args={[0.05, 0.05, BRACKET_DEPTH]} />
        <meshStandardMaterial color={metal} />
      </mesh>

      <group position={[0, 0, BRACKET_DEPTH]}>
        {/* base plate: same square footprint as the posts, so their outer faces meet flush */}
        <mesh position={[0, BASE_CENTER_Y, 0]}>
          <boxGeometry args={[PLATE_SIZE, BASE_THICKNESS, PLATE_SIZE]} />
          <meshStandardMaterial color={metal} />
        </mesh>

        {CAGE_CORNERS.map(([sx, sz], i) => (
          <mesh key={i} position={[sx * CAGE_HALF, POST_CENTER_Y, sz * CAGE_HALF]}>
            <boxGeometry args={[POST_THICKNESS, POST_HEIGHT, POST_THICKNESS]} />
            <meshStandardMaterial color={metal} />
          </mesh>
        ))}

        {/* top plate, capping the posts before the pyramidal roof */}
        <mesh position={[0, TOP_PLATE_CENTER_Y, 0]}>
          <boxGeometry args={[PLATE_SIZE, TOP_PLATE_THICKNESS, PLATE_SIZE]} />
          <meshStandardMaterial color={metal} />
        </mesh>

        <mesh position={[0, ROOF_CENTER_Y, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[CAGE_HALF * 1.5, ROOF_HEIGHT, 4]} />
          <meshStandardMaterial color={metal} />
        </mesh>

        <Torch position={[0, FLAME_Y, 0]} scale={FLAME_SCALE} />
        <pointLight
          position={[0, FLAME_Y + 0.1, 0]}
          color={theme.fireplaceEmberColor}
          intensity={0.35}
          distance={2}
        />
      </group>
    </group>
  )
}
