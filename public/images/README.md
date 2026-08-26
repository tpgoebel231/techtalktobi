# Photos

JPEG/PNG binaries are not committed as-is (the GitHub connector used to
fill this repo cannot transport raw binary files without corrupting them).

Source of truth for GitHub: `scripts/image-payloads/**/*.b64`

CI and a fresh clone restore them with:

```bash
node scripts/decode-images.mjs
```

The decoder skips any destination that already exists, so a local
full-resolution copy is left alone.
