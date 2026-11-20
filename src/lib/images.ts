/**
 * Resized WebP variants made by scripts/build-image-variants.py:
 * /images/<name>.jpg -> /images/<name>-{480,800,1200}.webp (capped at the
 * source width). The JPG stays as `src` fallback.
 */
const VARIANT_WIDTHS: Record<string, number[]> = {
  "/images/research-muskonomy.jpg": [480, 800, 1200],
  "/images/tobias.jpg": [400],
};
const DEFAULT_WIDTHS = [480, 800, 1200];

export function imageSrcSet(src: string): string | undefined {
  const match = src.match(/^\/images\/([a-z0-9-]+)\.jpg$/);
  if (!match) return undefined;
  const widths = VARIANT_WIDTHS[src] ?? DEFAULT_WIDTHS;
  return widths.map((w) => `/images/${match[1]}-${w}.webp ${w}w`).join(", ");
}

/** `sizes` for a 3-up card grid inside the 6xl container. */
export const CARD_SIZES = "(min-width: 1152px) 360px, (min-width: 768px) 31vw, calc(100vw - 40px)";
