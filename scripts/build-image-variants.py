#!/usr/bin/env python3
"""Resized WebP variants for public/images/*.jpg (srcset) and a small logo.

Run from the repo root after adding or replacing an image:
    python3 scripts/build-image-variants.py
Writes <name>-<width>.webp next to each JPG (widths not larger than the
source), plus public/logo-128.png. Requires Pillow.
"""
from pathlib import Path
from PIL import Image

WIDTHS = (480, 800, 1200)
ROOT = Path(__file__).resolve().parent.parent / "public"


def variants(src: Path) -> None:
    im = Image.open(src).convert("RGB")
    for w in WIDTHS:
        if w > im.width:
            w = im.width
        out = src.with_name(f"{src.stem}-{w}.webp")
        h = round(im.height * w / im.width)
        im.resize((w, h), Image.LANCZOS).save(out, "WEBP", quality=78, method=6)
        if w == im.width:
            break


for jpg in sorted((ROOT / "images").glob("*.jpg")):
    if jpg.stem.startswith("tobias-goebel-headshot"):
        continue  # headshot variants are made by build-headshot step
    variants(jpg)

logo = Image.open(ROOT / "logo.png")
logo.resize((128, 128), Image.LANCZOS).save(ROOT / "logo-128.png", optimize=True)
