# Draft: render-artifact-static.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/render-artifact-static.ts` (+ mobile mirror)

**Gap (feature 52):** Artifact Layer — PNG/WebP static export from validated document.

**Source:** `brioela-specs/42-brioela-generative-grammar.md` Artifact Layer, `36-harvest/04-share-cards.md`

---

```typescript
import type { BrioelaGenerativeUiDocument } from '@brioela/shared/grammar'
import { validateBrioelaGenerativeUi } from './validate-brioela-generative-ui'

export type ArtifactRenderFormat = 'png' | 'webp'

export type RenderArtifactStaticInput = {
	document: BrioelaGenerativeUiDocument
	format: ArtifactRenderFormat
	widthPx: number
	heightPx: number
}

export type RenderArtifactStaticResult = {
	bytes: Uint8Array
	mimeType: 'image/png' | 'image/webp'
	widthPx: number
	heightPx: number
}

/**
 * Server-side static snapshot for Discovery Cards, Passport image, Harvest share cards.
 * Caller must pass already-validated + privacy-scrubbed content (**51**, **47**).
 * On validation failure, returns null — caller uses design-system template fallback.
 */
export async function renderArtifactStatic(
	input: RenderArtifactStaticInput,
): Promise<RenderArtifactStaticResult | null> {
	const validated = validateBrioelaGenerativeUi(input.document)
	if (!validated.ok) {
		return null
	}

	// Implementation: headless render via mobile snapshot bridge or server canvas
	// EXIF/metadata stripped per Ground/Harvest media rules when used for share

	void input.format
	void input.widthPx
	void input.heightPx

	throw new Error('renderArtifactStatic not implemented')
}
```
