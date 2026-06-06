# Recipe Ingestion — Share Sheet Entry

## What This File Covers

The native iOS/Android share-sheet entry point: what the extension accepts, how fast it must respond, what it sends to the backend, and why this is a distribution surface, not just an import utility.

---

## Product Rule

Share-sheet import must feel instant.

The user is watching a food video or reading a recipe page. They tap Share → Brioela. Within 2 seconds, Brioela confirms that the import has started.

The app does not need to be open.

---

## Accepted Inputs

The extension accepts:

- URL from TikTok, YouTube, Instagram, Safari, Chrome, or any browser.
- Native shared media reference when available.
- Screenshot or image containing recipe text.
- Page title, preview text, thumbnail, and app bundle/source metadata when the platform provides it.

Input envelope:

```typescript
type RecipeShareInput = {
  sourceType: "url" | "video_url" | "image" | "native_media_reference"
  sourceUrl: string | null
  sourceApp: "tiktok" | "youtube" | "instagram" | "browser" | "unknown"
  titleHint: string | null
  previewText: string | null
  thumbnailUrl: string | null
  localImageBase64: string | null
  sharedAt: number
}
```

The extension does not normalize recipes. It only captures the share payload and starts the import job.

---

## Extension Response Contract

The share extension must complete fast enough that users trust it.

Within 2 seconds:

1. Validate the payload enough to reject obviously unsupported input.
2. Call `POST /api/recipes/import`.
3. Receive `jobId`.
4. Show confirmation.
5. Close or offer "Open Brioela".

Confirmation copy:

```text
Import started. I'll turn this into a recipe in the background.
```

If the user is not signed in, the extension should preserve the pending import locally long enough for sign-in handoff, but the first implementation can require authentication before import.

---

## Backend Request

```typescript
type CreateRecipeImportRequest = {
  sourceType: "url" | "video_url" | "image" | "native_media_reference"
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

The endpoint writes the import job immediately, then hands work to the durable import workflow.

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
I am already watching a recipe. One tap turns it into something I can cook.
```

The extension must be reliable from day one because failed imports break both utility and word-of-mouth.
