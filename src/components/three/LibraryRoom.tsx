import { useLibraryTheme } from '../../three/ThemeContext'
import { ROOM_HEIGHT, type Placement } from '../../three/libraryLayout'
import { Room } from './Room'
import { Door } from './Door'
import { Candle } from './Candle'
import { WallTorch } from './WallTorch'
import { Bookcase, BOOKCASE_HEIGHT, BOOKCASE_WIDTH } from './Bookcase'
import type { Book } from '../../types'

// Each candle is a point light, so only every other bookcase gets one, up to this many.
const MAX_CANDLES = 6

// The library room itself — walls, lights, the shelves' bookcases, candles, the door back
// to the lobby — without any camera. Both the library view and the shelf close-up render
// this same room (only the camera and what's clickable differ), so moving from one to the
// other shows exactly the same walls, floor, lighting and decor.
export function LibraryRoom({
  half,
  placements,
  onSelectBookcase,
  focusedShelfId,
  onSelectBook,
  onExit,
}: {
  half: number
  placements: Placement[]
  // library view: every bookcase is one click target
  onSelectBookcase?: (placement: Placement) => void
  // close-up: only the focused shelf's books (in any of its bookcases) are clickable
  focusedShelfId?: string
  onSelectBook?: (book: Book) => void
  onExit?: () => void
}) {
  const theme = useLibraryTheme()

  return (
    <>
      <ambientLight intensity={theme.ambientIntensity} />
      <pointLight position={[0, ROOM_HEIGHT - 0.3, 0]} intensity={0.8} />
      {/* warm fill for the bookcases: they stand further from the center than the lobby's
          furniture and the room grows with the shelf count, so its intensity scales with the
          room's size (light falls off with distance squared) to keep books readable */}
      <pointLight position={[0, 1.8, 0]} color={theme.bookTitleColor} intensity={half * half * 0.4} />

      <Room size={half * 2} height={ROOM_HEIGHT} />

      {placements.map((p, i) => (
        <group key={`${p.shelf.id}:${p.part}`}>
          <Bookcase
            position={p.position}
            rotation={[0, p.rotationY, 0]}
            name={p.shelf.name}
            books={p.books}
            onSelect={onSelectBookcase && (() => onSelectBookcase(p))}
            onSelectBook={p.shelf.id === focusedShelfId ? onSelectBook : undefined}
          />
          {/* candle on top of every other bookcase, beside its name label */}
          {i % 2 === 0 && i / 2 < MAX_CANDLES && (
            <group position={p.position} rotation={[0, p.rotationY, 0]}>
              <Candle position={[BOOKCASE_WIDTH / 2 - 0.1, BOOKCASE_HEIGHT, 0]} />
            </group>
          )}
        </group>
      ))}

      {/* door behind the starting view: back to the lobby */}
      <Door position={[0, 0, half]} rotation={[0, Math.PI, 0]} label="Le hall" onSelect={onExit} />

      {/* lanterns flanking the door, like the lobby's library door */}
      <WallTorch position={[-1, 1.3, half]} rotation={[0, Math.PI, 0]} />
      <WallTorch position={[1, 1.3, half]} rotation={[0, Math.PI, 0]} />
    </>
  )
}
