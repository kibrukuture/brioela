# Gap snapshot: extract.source.artifacts.helper.ts

Target: `backend/src/api/recipes/_helpers/extract.source.artifacts.helper.ts`

**Status:** Not in repo. `03-source-extraction.md`.

```typescript
import { createId } from '@brioela/shared/id'
import { supabase } from '@/core/database/supabase-admin-client'
import {
	RecipeSourceArtifactsSchema,
	type RecipeShareInput,
	type RecipeSourceArtifacts,
} from '@brioela/shared/validator/recipe.import'
import { enhanceImageForVision } from './enhance.image.helper'
import { extractTextFromImage } from '@/core/ai/functions/extract-text'

type ExtractEnv = Cloudflare.Env

const FETCH_TIMEOUT_MS = 12000
const MAX_BYTES = 2_000_000

async function fetchPageText(url: string): Promise<{ text: string; canonicalUrl: string | null }> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
	const response = await fetch(url, { signal: controller.signal, redirect: 'follow' })
	clearTimeout(timeout)

	if (!response.ok) throw new Error(`fetch_failed_${response.status}`)
	const buffer = await response.arrayBuffer()
	if (buffer.byteLength > MAX_BYTES) throw new Error('response_too_large')

	const html = new TextDecoder().decode(buffer)
	const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').slice(0, 50000)
	const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
	return { text, canonicalUrl: canonicalMatch?.[1] ?? null }
}

export async function extractSourceArtifacts(
	env: ExtractEnv,
	jobId: string,
	input: RecipeShareInput,
): Promise<RecipeSourceArtifacts> {
	const warnings: string[] = []
	let extractedPageText: string | null = null
	let extractedImageText: string | null = null
	let canonicalUrl: string | null = null

	if (input.sourceUrl?.startsWith('http')) {
		try {
			const page = await fetchPageText(input.sourceUrl)
			extractedPageText = page.text
			canonicalUrl = page.canonicalUrl
		} catch {
			warnings.push('page_fetch_failed')
		}
	}

	if (input.imageBase64) {
		const enhanced = await enhanceImageForVision(input.imageBase64)
		const vision = await extractTextFromImage(env, enhanced)
		extractedImageText = vision.text
		if (vision.confidence < 0.5) warnings.push('vision_extraction_uncertain')
	}

	const artifacts = RecipeSourceArtifactsSchema.parse({
		jobId,
		sourceUrl: input.sourceUrl,
		canonicalUrl,
		title: input.titleHint,
		authorName: null,
		transcript: null,
		captions: input.previewText,
		extractedPageText,
		extractedImageText,
		thumbnailUrl: input.thumbnailUrl,
		mediaDurationSeconds: null,
		extractionWarnings: warnings,
	})

	await supabase.from('recipe_source_artifacts').insert({
		id: createId(),
		import_job_id: jobId,
		user_id: env.USER_ID_PLACEHOLDER,
		transcript: artifacts.transcript,
		captions: artifacts.captions,
		extracted_page_text: artifacts.extractedPageText,
		extracted_image_text: artifacts.extractedImageText,
		thumbnail_url: artifacts.thumbnailUrl,
		canonical_url: artifacts.canonicalUrl,
		author_name: artifacts.authorName,
		extraction_warnings_json: JSON.stringify(artifacts.extractionWarnings),
		created_at: Date.now(),
	})

	return artifacts
}
```
