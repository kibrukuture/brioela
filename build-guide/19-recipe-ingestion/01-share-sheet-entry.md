# Recipe Ingestion — Share Sheet Entry

## What This File Covers

The native iOS/Android share-sheet entry point: what the extension accepts, how fast it must respond, what it sends to the backend, and why this is a general Brioela intake surface, not only a recipe utility.

---

## Product Rule

Share-sheet intake must feel instant.

The user is watching a food video, reading a recipe page, looking at a restaurant, viewing a menu, or saving a food-related post. They tap Share → Brioela. Within 2 seconds, Brioela confirms that it captured the share and will process it.

The app does not need to be open.

---

## Accepted Inputs

The extension accepts:

- URL from TikTok, YouTube, Instagram, Safari, Chrome, or any browser.
- Native shared media reference when available.
- Screenshot or image containing recipe text.
- Restaurant/menu/place URLs.
- Product, receipt, or food label images.
- Page title, preview text, thumbnail, and app bundle/source metadata when the platform provides it.

Input envelope:

```typescript
type RecipeShareInput = {
  sourceType: "url" | "video_url" | "image" | "native_media_reference" | "place_url" | "unknown"
  sourceUrl: string | null
  sourceApp: "tiktok" | "youtube" | "instagram" | "browser" | "unknown"
  titleHint: string | null
  previewText: string | null
  thumbnailUrl: string | null
  localImageBase64: string | null
  sharedAt: number
}
```

The extension does not decide whether something is a recipe. It captures the share payload and starts the shared-content intake job. Server-side classification decides the route.

---

## Extension Response Contract

The share extension must complete fast enough that users trust it.

Within 2 seconds:

1. Validate the payload enough to reject obviously unsupported input.
2. Call `POST /api/shared/import`.
3. Receive `jobId`.
4. Show confirmation.
5. Close or offer "Open Brioela".

Confirmation copy:

```text
Saved to Brioela. I'll figure out what this is and where it belongs.
```

If the user is not signed in, the extension should preserve the pending import locally long enough for sign-in handoff, but the first implementation can require authentication before import.

---

## Backend Request

```typescript
type CreateRecipeImportRequest = {
  sourceType: "url" | "video_url" | "image" | "native_media_reference" | "place_url" | "unknown"
  sourceUrl: string | null
  sourceApp: string | null
  titleHint: string | null
  previewText: string | null
  thumbnailUrl: string | null
  imageBase64: string | null
  sharedAt: number
}

type CreateRecipeImportResponse = {
  jobId: string
  status: "queued"
  estimatedSeconds: number | null
}
```

The endpoint writes the shared intake job immediately, then hands work to the durable workflow. Recipe import is one possible downstream route.

---

## Platform Boundaries

iOS:

- Native share extension is required.
- Extension has tight time and memory limits.
- Do not run model calls inside the extension.
- Avoid large media uploads from the extension unless the platform gives a safe file handle.

Android:

- Handle `ACTION_SEND` and `ACTION_SEND_MULTIPLE` where applicable.
- Accept URLs and images.
- Same backend contract as iOS.

PWA:

- PWA can support manual URL paste/share target where browser support allows.
- iOS PWA share target support is not sufficient for the core loop.
- Native app remains required for first-class share-sheet import.

---

## Growth Boundary

This share sheet is one of Brioela's acquisition surfaces.

The first moment is not "download our app." It is:

```text
I am already looking at food content. One tap lets Brioela turn it into something useful.
```

The extension must be reliable from day one because failed imports break both utility and word-of-mouth.
