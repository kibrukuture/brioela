# Gap snapshot: downsample-jpeg.helper.ts

Target: `backend/src/agents/mira/_helpers/downsample-jpeg.helper.ts`

**Status:** Not in repo. Required by `visual-change-detector.ts`. Spec: `02-visual-change-detector.md` — JPEG decode → 16×16 grayscale (256 bytes).

```typescript
/**
 * Decode JPEG and downsample to 16×16 grayscale for frame-diff.
 * Implementation must use a Workers-compatible image library (e.g. @cf-wasm/photon, imagescript).
 * Placeholder returns zeros until decode lib is chosen and installed.
 */
export function downsampleJpegToGrayscale16(jpegData: ArrayBuffer): Uint8Array {
	const out = new Uint8Array(256)
	// TODO: decode jpegData, resize to 16x16, convert to luminance 0-255 per pixel
	void jpegData
	return out
}
```
