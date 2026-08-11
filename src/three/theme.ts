// A theme only carries colors/textures. 3D components (Room, Desk, Door…) never
// hardcode appearance — they read it from the active theme via useLibraryTheme(),
// so a new theme is a drop-in swap without touching component code.
export interface LibraryTheme {
  name: string
  wallColor: string
  wallTexture?: string
  floorColor: string
  floorTexture?: string
  ceilingColor: string
  ceilingTexture?: string
  deskColor: string
  deskAccentColor: string
  deskTexture?: string
  doorColor: string
  doorHoverColor: string
  doorFrameColor: string
  doorTexture?: string
  fireplaceEmberColor: string
  fireplaceHearthTexture?: string
  fireplaceJambTexture?: string
  fireplaceFireTexture?: string
  torchFlameTexture?: string
  candleTexture?: string
  labelColor: string
  ambientIntensity: number
}

export const oakTheme: LibraryTheme = {
  name: 'oak',
  wallColor: '#e7dfd3',
  wallTexture: '/textures/wall-stone-01.webp',
  floorColor: '#8a5a34',
  floorTexture: '/textures/floor-wood-02.webp',
  ceilingColor: '#4b3d31',
  ceilingTexture: '/textures/ceiling-beams-01.webp',
  deskColor: '#6b4226',
  deskAccentColor: '#3d2817',
  deskTexture: '/textures/desk-wood-01.webp',
  doorColor: '#4a2f1c',
  doorHoverColor: '#6b4226',
  doorFrameColor: '#2e1c10',
  doorTexture: '/textures/door-arched-01.webp',
  fireplaceEmberColor: '#ff7a33',
  fireplaceHearthTexture: '/textures/hearth-stone-01.webp',
  fireplaceJambTexture: '/textures/fireplace-jamb-01.webp',
  fireplaceFireTexture: '/textures/fireplace-fire-01.webp',
  torchFlameTexture: '/textures/torch-flame-01.webp',
  candleTexture: '/textures/candle-01.webp',
  labelColor: '#374151',
  ambientIntensity: 0.6,
}

export const defaultTheme = oakTheme
