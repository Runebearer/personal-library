import { useRef, useState, type PointerEvent } from 'react'
import { hexToHsv, hsvToHex, type Hsv } from '../lib/color'

const SIZE = 168 // px

// Color wheel: hue around, saturation from the center out, plus a brightness slider. Drawn
// with CSS gradients (no canvas, no dependency); onChange gets a #rrggbb string.
export function ColorWheel({
  value,
  onChange,
}: {
  value: string | null
  onChange: (hex: string) => void
}) {
  const [hsv, setHsv] = useState<Hsv>(() => (value ? hexToHsv(value) : { h: 0, s: 0, v: 1 }))
  const wheelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function update(next: Hsv) {
    setHsv(next)
    onChange(hsvToHex(next))
  }

  function pick(e: PointerEvent) {
    const rect = wheelRef.current!.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
    const s = Math.min(1, Math.hypot(dx, dy) / (rect.width / 2))
    update({ ...hsv, h, s })
  }

  // the picking handle, on the wheel at the current hue/saturation
  const angle = (hsv.h * Math.PI) / 180
  const handleX = SIZE / 2 + Math.cos(angle) * hsv.s * (SIZE / 2)
  const handleY = SIZE / 2 + Math.sin(angle) * hsv.s * (SIZE / 2)

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wheelRef}
        className="relative cursor-pointer touch-none rounded-full"
        style={{
          width: SIZE,
          height: SIZE,
          // conic-gradient starts at 12 o'clock; the pointer math starts at 3 o'clock
          background:
            'radial-gradient(circle closest-side, #fff, transparent), conic-gradient(from 90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        }}
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => dragging.current && pick(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        {/* brightness: the wheel fades to black */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full bg-black"
          style={{ opacity: 1 - hsv.v }}
        />
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40"
          style={{ left: handleX, top: handleY, backgroundColor: hsvToHex(hsv) }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(hsv.v * 100)}
        onChange={(e) => update({ ...hsv, v: Number(e.target.value) / 100 })}
        aria-label="Luminosité"
        className="w-full"
        style={{ accentColor: hsvToHex({ ...hsv, v: 1 }) }}
      />
    </div>
  )
}
