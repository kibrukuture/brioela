# Gap snapshot: mobile share extension

Target: `mobile/features/share-extension/` + native targets

**Status:** Not in repo. `01-share-sheet-entry.md`, `brioela-specs/20-platform-and-app-distribution.md`.

```typescript
// mobile/features/share-extension/share-extension.api.ts
import { RecipeShareInputSchema } from '@brioela/shared/validator/recipe.import'
import { apiClient } from '@/network/api-client'

export async function submitSharedImport(input: {
	sourceType: string
	sourceUrl: string | null
	sourceApp: string | null
	titleHint: string | null
	previewText: string | null
	thumbnailUrl: string | null
	imageBase64: string | null
	sharedAt: number
}) {
	const body = RecipeShareInputSchema.parse({
		...input,
		sharedAt: input.sharedAt ?? Date.now(),
	})
	return apiClient.post('/api/shared/import', body)
}

// iOS Share Extension (Swift) — must complete within 2 seconds:
// 1. Read NSExtensionItem attachments (URL / image)
// 2. Map to RecipeShareInput fields
// 3. Call submitSharedImport via shared App Group token or lightweight Worker URL
// 4. Show UI: "Saved to Brioela. I'll figure out what this is and where it belongs."
// 5. No model calls in extension process

// Android ShareReceiverActivity.kt — ACTION_SEND / ACTION_SEND_MULTIPLE
// Same contract as iOS; reuse share-extension.api.ts via React Native bridge or direct HTTP
```

**Platform notes:**

- Extension memory/time limits — no GPT-4o mini in extension.
- PWA share target is secondary; iOS requires native app (`01-share-sheet-entry.md`).
- Auth: first implementation may require signed-in user before import.
