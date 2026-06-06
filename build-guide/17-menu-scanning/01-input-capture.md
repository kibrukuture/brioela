# Menu Scanning — Input Capture

## What This File Covers

How the user gets a restaurant menu into Brioela: a single photo, multiple pages, a QR/menu URL, or a low-light restaurant photo. This file only covers input capture and normalization before OCR/parsing begins.

---

## Entry Points

Menu scanning has three user entry paths:

- Camera capture from the scanner surface.
- Multi-page capture from a menu-scanning session.
- Shared URL from a browser, restaurant QR page, or platform menu page.

The scanner's barcode flow is not reused directly. Menu scanning reuses the camera/OCR infrastructure from `07-scanner`, but it has its own endpoint and session shape because the output is a list of dishes, not one product verdict.

```typescript
// Mobile sends photo menus to:
// POST /api/menu-scans/photos
// Body: { imagesBase64, restaurantId?, placeName?, geoHash?, capturedAt }

// Mobile sends digital menus to:
// POST /api/menu-scans/url
// Body: { url, restaurantId?, placeName?, geoHash?, capturedAt }
```

---

## Single Photo Capture

The user points at a menu page and captures a still image. The image is encoded as JPEG at the same baseline quality used by the scanner OCR path unless testing shows menus need a higher default.

Capture requirements:

- Include the full visible page whenever possible.
- Preserve enough resolution for dish names and descriptions.
- Include `capturedAt` for offline-safe event timing.
- Include `geoHash` only if location permission is already granted.
- Do not require restaurant lookup before scanning; place association is optional.

The UI should let the user proceed even when no place is selected. A menu scan can be useful without map context.

---

## Multi-Page Capture

Multi-page menu capture is a short-lived local session. The user can add pages until they tap analyze.

Client state:

```typescript
type MenuCapturePage = {
  localId: string
  imageBase64: string
  capturedAt: number
  order: number
}

type MenuCaptureDraft = {
  pages: MenuCapturePage[]
  restaurantId: string | null
  placeName: string | null
  geoHash: string | null
}
```

Rules:

- Preserve page order exactly as captured.
- Let the user delete a blurry page before submitting.
- Do not stitch images visually on-device.
- Send pages as an ordered array; the backend merges OCR text sections after extraction.
- If one page fails OCR, return partial results for readable pages with a visible warning.

---

## Digital Menu URL

Digital menu ingestion accepts a shared URL. The backend fetches readable menu text and normalizes it into the same parsing path used by photo OCR.

URL rules:

- Reject non-HTTP(S) URLs.
- Enforce fetch timeout and response-size limits.
- Extract visible menu text only; ignore scripts, hidden content, ads, and tracking copy.
- If the page is image-only or JavaScript-only and text extraction fails, ask the user to screenshot or photograph the menu instead.
- Treat URL-derived text as untrusted input; never execute page code.

The parser must not give URL menus a stronger confidence level than photo menus. Both are unstructured restaurant content.

---

## Low-Light Restaurant Conditions

Restaurant menus often have dark backgrounds, glare, small typography, and poor lighting. The same server-side contrast enhancement from `07-scanner/05-ocr-fallback.md` runs before OCR.

Low-light handling:

- Run contrast enhancement server-side before Gemini Vision OCR.
- Preserve the original image only for the active request.
- Return warnings such as `low_light`, `glare`, `partial_page`, or `text_too_small`.
- If confidence is too low, ask for a closer/brighter photo instead of guessing.

Hard allergy safety beats latency. A readable result after one retry is better than a fast invented result.

---

## Output To Next Step

Capture produces one normalized request for OCR/parsing:

```typescript
type MenuScanInput = {
  source: "photo" | "multi_page_photo" | "url"
  imagePages?: string[]
  extractedUrlText?: string
  restaurantId: string | null
  placeName: string | null
  geoHash: string | null
  capturedAt: number
}
```

No dish verdict is computed in the capture layer.
