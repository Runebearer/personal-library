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
  deskColor: string
  deskAccentColor: string
  doorColor: string
  doorHoverColor: string
  doorFrameColor: string
  doorTexture?: string
  labelColor: string
  ambientIntensity: number
}

export const oakTheme: LibraryTheme = {
  name: 'oak',
  wallColor: '#e7dfd3',
  wallTexture: '/textures/wall-stone-01.webp',
  floorColor: '#8a5a34',
  floorTexture: '/textures/floor-wood-01.webp',
  ceilingColor: '#f5f1e8',
  deskColor: '#6b4226',
  deskAccentColor: '#3d2817',
  doorColor: '#4a2f1c',
  doorHoverColor: '#6b4226',
  doorFrameColor: '#2e1c10',
  doorTexture: '/textures/door-arched-01.webp',
  labelColor: '#374151',
  ambientIntensity: 0.6,
}

export const defaultTheme = oakTheme
