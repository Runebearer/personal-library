// Shared look of the hover halo on clickable scene objects, so the door (which traces its
// texture's alpha cutout) and the bookcases (which trace their box silhouette) glow alike.
export const HOVER_GLOW = '#fdf6e3'

// The halo fades out in this many discrete rings from the silhouette edge.
export const GLOW_RADIUS_STEPS = 14

// World-space reach of the halo past the silhouette. Matches the door's (GLOW_WIDTH_TEXELS
// of its 512px-wide texture over its ~1.17m width ≈ 5cm).
export const GLOW_WORLD_WIDTH = 0.05
