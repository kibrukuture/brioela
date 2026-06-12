# Draft: embed.text.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/embed.text.helper.ts`

**Gap (feature 17):** Cohere `embed-multilingual-v2.0` REST client per `implementable-specs/18-vectorize.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { HTTPException } from 'hono/http-exception'
import { ErrorCode } from '@brioela/shared/types/api'

export const EMBEDDING_MODEL = 'embed-multilingual-v2.0' as const
export const EMBEDDING_DIMENSIONS = 768 as const

export type CohereInputType = 'search_document' | 'search_query'

type CohereEmbedResponse = {
	embeddings: number[][]
}

export async function embedText(
	text: string,
	inputType: CohereInputType,
	env: Pick<Env, 'COHERE_API_KEY'>,
): Promise<number[]> {
	const trimmed = text.trim()
	if (!trimmed) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'embedText requires non-empty text' })
	}

	const response = await fetch('https://api.cohere.ai/v1/embed', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.COHERE_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			texts: [trimmed],
			model: EMBEDDING_MODEL,
			input_type: inputType,
			truncate: 'END',
		}),
	})

	if (!response.ok) {
		const body = await response.text()
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, {
			message: `Cohere embed failed (${response.status}): ${body.slice(0, 200)}`,
		})
	}

	const data = (await response.json()) as CohereEmbedResponse
	const vector = data.embeddings[0]
	if (!vector || vector.length !== EMBEDDING_DIMENSIONS) {
		throw new HTTPException(ErrorCode.UPSTREAM_ERROR, {
			message: `Cohere embed returned invalid dimensions: expected ${EMBEDDING_DIMENSIONS}`,
		})
	}

	return vector
}
```

Export from `_helpers/index.ts` when helpers barrel exists.

**Note:** Use `search_document` for stored summaries; `search_query` for retrieval queries only.
