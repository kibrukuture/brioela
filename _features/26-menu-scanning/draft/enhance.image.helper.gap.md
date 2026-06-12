# Gap snapshot: enhance.image.helper.ts

Target: `backend/src/api/menu-scans/_helpers/enhance.image.helper.ts` (or shared `backend/src/api/_helpers/enhance.image.helper.ts`)

**Status:** Not in repo. Shared by **24** scanner and **26** menu scanning. From `build-guide/07-scanner/05-gpt4o-mini-vision-fallback.md`.

```typescript
/**
 * Server-side contrast enhancement for low-light menu and product label photos.
 * Ship once — import from menu-scans and scan modules.
 */
export async function enhanceForVisionExtraction(imageBase64: string): Promise<string> {
  // v1: pass-through with validation; replace with sharp/wasm contrast pipeline
  if (!imageBase64 || imageBase64.length < 100) {
    throw new Error('invalid_image_payload')
  }
  return imageBase64
}
```

**Cross-feature:** `_features/24-scanner/draft/vision-extract.handler.gap.md` imports this helper. Prefer single shared module to avoid duplication.
