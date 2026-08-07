#!/usr/bin/env python3
"""Clean up a cutout texture's alpha channel and re-encode it losslessly.

Why this exists
----------------
Some of the pixel-art assets in public/textures/ (first found in
door-arched-01.webp) have two separate problems baked into the file:

1. Their "transparent" background isn't actually clean alpha=0. It carries
   a faint, dense, repeating pattern (a watermark/dither artifact from
   whatever tool exported the asset) spread across low alpha values. Where
   Door.tsx (or any other consumer) uses `alphaTest`, any pixel whose alpha
   crosses the cutoff renders fully opaque — so fragments of that pattern
   show up as scattered light dots wherever the alphaTest threshold happens
   to catch them. This only becomes visible once you boost the alpha
   channel (see --report); at normal opacity it looks like plain
   transparency.

2. The RGB channel was saved lossy (standard WebP/JPEG-style block
   compression). Right at the real silhouette edge, anti-aliased pixels
   pick up "ringing" toward whatever matte color the asset was flattened
   against, so alphaTest shows a faint light halo hugging the shape.

The fix, in order:
  a) Connected-component label every pixel above --alpha-keep. Keep only
     the single largest component (the real silhouette + its genuine
     anti-aliased boundary at that threshold) and zero the alpha of every
     other component, no matter how close it sits to the real edge or how
     high its alpha is. This removes the baked-in pattern without touching
     the actual shape.
  b) Alpha-bleed: extrapolate solid RGB color from the interior outward
     into the remaining thin edge band, so no matte/ringing color survives
     at the cutout boundary.
  c) Re-save as lossless WebP so the fix can't be undone by another lossy
     compression pass.

Usage
-----
    pip install numpy scipy pillow
    python scripts/fix_alpha_texture.py public/textures/some-asset.webp
    python scripts/fix_alpha_texture.py public/textures/some-asset.webp --report

Run with --report first on any new asset: it prints how many pixels would
be zeroed and writes an alpha-boosted PNG next to the source so you can
eyeball whether the asset actually has this problem before touching it.
Textures without an alpha channel, or with clean alpha, are a no-op
(0 pixels zeroed) and safe to run through unconditionally.

The script always writes to a new path (default: <name>.fixed.webp) and
never overwrites the input — review the result, then copy it over the
original yourself once you're happy with it.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

OFFSETS = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]


def _shift(mask_or_color, dy, dx):
    shifted = np.roll(np.roll(mask_or_color, dy, axis=0), dx, axis=1)
    if dy == -1:
        shifted[-1, ...] = False if shifted.dtype == bool else 0
    elif dy == 1:
        shifted[0, ...] = False if shifted.dtype == bool else 0
    if dx == -1:
        shifted[:, -1, ...] = False if shifted.dtype == bool else 0
    elif dx == 1:
        shifted[:, 0, ...] = False if shifted.dtype == bool else 0
    return shifted


def strip_baked_pattern(alpha: np.ndarray, alpha_keep: float) -> tuple[np.ndarray, dict]:
    """Keep only the largest connected component above alpha_keep; zero the rest."""
    candidate = alpha >= alpha_keep
    labels, n = ndimage.label(candidate, structure=np.ones((3, 3), dtype=bool))
    if n == 0:
        return alpha.copy(), {"components_found": 0, "components_removed": 0, "pixels_zeroed": 0}

    sizes = ndimage.sum(candidate, labels, index=range(1, n + 1))
    main_label = 1 + int(np.argmax(sizes))
    keep_mask = labels == main_label

    new_alpha = np.where(keep_mask, alpha, 0.0)
    stats = {
        "components_found": n,
        "components_removed": n - 1,
        "pixels_zeroed": int(candidate.sum() - keep_mask.sum()),
    }
    return new_alpha, stats


def bleed_rgb(rgb: np.ndarray, alpha: np.ndarray, opaque_threshold: float, iterations: int) -> np.ndarray:
    """Extrapolate solid color outward into the (thin, post-cleanup) edge band."""
    solid = alpha >= opaque_threshold
    filled = solid.copy()
    color = rgb.copy()
    color[~filled] = 0

    for _ in range(iterations):
        unfilled = (alpha > 0) & ~filled
        if not unfilled.any():
            break
        acc = np.zeros_like(color)
        count = np.zeros(filled.shape, dtype=np.float32)
        for dy, dx in OFFSETS:
            shifted_filled = _shift(filled, dy, dx)
            shifted_color = _shift(color, dy, dx)
            mask = shifted_filled & unfilled
            acc[mask] += shifted_color[mask]
            count += mask.astype(np.float32)
        newly = (count > 0) & unfilled
        color[newly] = acc[newly] / count[newly, None]
        filled |= newly

    return color


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source", type=Path, help="Texture to fix (must have an alpha channel)")
    parser.add_argument("-o", "--output", type=Path, default=None, help="Output path (default: <source>.fixed.webp)")
    parser.add_argument(
        "--alpha-keep",
        type=float,
        default=110,
        help="Connectivity threshold (0-255) for isolating the real silhouette from background noise. "
        "Raise it if the fixed result still shows fragments touching the real edge; "
        "lower it if part of the real silhouette gets zeroed out. Default: 110",
    )
    parser.add_argument("--opaque-threshold", type=float, default=250, help="Alpha value counted as fully solid for RGB bleeding. Default: 250")
    parser.add_argument("--bleed-iterations", type=int, default=6, help="Max pixels to bleed color outward from solid interior. Default: 6")
    parser.add_argument("--report", action="store_true", help="Print stats and write an alpha-boosted PNG preview; do not write the fixed texture")
    args = parser.parse_args()

    if not args.source.exists():
        print(f"error: {args.source} not found", file=sys.stderr)
        return 1

    im = Image.open(args.source).convert("RGBA")
    arr = np.array(im).astype(np.float32)
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]

    if args.report:
        preview_path = args.source.with_suffix(".alpha-preview.png")
        boosted = np.clip(alpha * 8, 0, 255).astype("uint8")
        Image.fromarray(boosted).save(preview_path)
        _, stats = strip_baked_pattern(alpha, args.alpha_keep)
        print(f"components found: {stats['components_found']}")
        print(f"components that would be removed as noise: {stats['components_removed']}")
        print(f"pixels that would be zeroed: {stats['pixels_zeroed']}")
        print(f"alpha-boosted preview written to: {preview_path}")
        print("(a dense repeating pattern in that preview outside the real shape means this asset needs the fix)")
        return 0

    new_alpha, stats = strip_baked_pattern(alpha, args.alpha_keep)
    new_rgb = bleed_rgb(rgb, new_alpha, args.opaque_threshold, args.bleed_iterations)

    out = arr.copy()
    out[:, :, :3] = new_rgb
    out[:, :, 3] = new_alpha
    out = np.clip(out, 0, 255).astype(np.uint8)

    output_path = args.output or args.source.with_suffix(".fixed.webp")
    Image.fromarray(out, mode="RGBA").save(output_path, lossless=True)

    print(f"components found: {stats['components_found']}, removed as noise: {stats['components_removed']}")
    print(f"pixels zeroed: {stats['pixels_zeroed']}")
    print(f"written: {output_path}")
    print("review it, then copy it over the original yourself if it looks right.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
