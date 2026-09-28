import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// Text drawn into a transparent canvas texture — for titles and name plates on 3D objects.
// No font file to load (system serif), so it works offline like the rest of the PWA.
export interface TextTextureOptions {
  width: number // canvas size in px; keep its aspect ratio equal to the plane it's mapped on
  height: number
  color: string
  fontSize: number
  fontFamily?: string
  maxLines?: number // text is wrapped, then shrunk until it fits in this many lines
}

const DEFAULT_FONT_FAMILY = 'Georgia, "Times New Roman", serif'
const LINE_HEIGHT_RATIO = 1.15
const MIN_FONT_SIZE = 12

// Greedy word wrap to maxWidth.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

export function useTextTexture(text: string | undefined, options: TextTextureOptions) {
  const { width, height, color, fontSize, fontFamily = DEFAULT_FONT_FAMILY, maxLines = 3 } =
    options

  const texture = useMemo(() => {
    if (!text) return null
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const maxWidth = width * 0.88
    let size = fontSize
    let lines: string[]
    for (;;) {
      ctx.font = `bold ${size}px ${fontFamily}`
      lines = wrapText(ctx, text, maxWidth)
      const tooWide = lines.some((l) => ctx.measureText(l).width > maxWidth)
      const tooTall = lines.length * size * LINE_HEIGHT_RATIO > height * 0.9
      if ((lines.length <= maxLines && !tooWide && !tooTall) || size <= MIN_FONT_SIZE) break
      size = Math.floor(size * 0.9)
    }

    const lineHeight = size * LINE_HEIGHT_RATIO
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const top = height / 2 - ((lines.length - 1) * lineHeight) / 2
    lines.forEach((l, i) => ctx.fillText(l, width / 2, top + i * lineHeight))

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [text, width, height, color, fontSize, fontFamily, maxLines])

  useEffect(() => () => texture?.dispose(), [texture])

  return texture
}
