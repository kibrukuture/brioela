# Draft: render.discovery.card.static.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/viral.sharing/render.discovery.card.static.helper.ts`

**Gap (feature 51):** Static PNG artifact after scrub — Artifact Layer output.

**Source:** `build-guide/24-viral-sharing/02-discovery-card-system.md`, `build-guide/27-generative-grammar/06-surface-integration.md`

---

```typescript
import type { DiscoveryCard } from '@brioela/shared/validator/viral.sharing/discovery.card.schema'

export type RenderDiscoveryCardStaticResult = {
	mimeType: 'image/png'
	bytes: Uint8Array
	width: number
	height: number
	exifStripped: true
}

type RenderInput = {
	card: DiscoveryCard
	grammarDocumentJson?: string | null
}

/**
 * Renders a static share image. Prefer grammar Artifact Layer (**52**) when present;
 * fall back to design-system template (**02**) when grammarDocumentJson is null.
 */
export async function renderDiscoveryCardStatic(
	input: RenderInput,
): Promise<RenderDiscoveryCardStaticResult> {
	if (input.grammarDocumentJson) {
		// **52** consumer: compile document → rasterize (Skia/server canvas)
		throw new Error('generative_grammar_artifact_renderer_not_wired')
	}

	// Fallback: fixed template — one finding, one context line, small attribution
	const placeholder = new TextEncoder().encode(
		JSON.stringify({
			title: input.card.title,
			finding: input.card.finding,
			attribution: input.card.attribution,
		}),
	)

	return {
		mimeType: 'image/png',
		bytes: placeholder,
		width: 1080,
		height: 1350,
		exifStripped: true,
	}
}
```
