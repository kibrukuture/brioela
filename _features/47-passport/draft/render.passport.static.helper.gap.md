# Draft: render.passport.static.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/render.passport.static.helper.ts`

**Gap (feature 47):** Static fallback renderer when **52** grammar surface fails.

**Source:** `build-guide/28-passport/07-rendering-with-grammar.md`

---

```typescript
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export type StaticPassportRenderInput = {
	title: string
	language: string
	instructionBlocks: InstructionBlock[]
	expiresAt: number
	revoked: boolean
}

export type StaticPassportRenderNode = {
	type: 'stack' | 'hero_line' | 'instruction_block' | 'expiration_note'
	payload: Record<string, unknown>
}

export function renderPassportStatic(input: StaticPassportRenderInput): StaticPassportRenderNode[] {
	const nodes: StaticPassportRenderNode[] = [
		{ type: 'hero_line', payload: { text: input.title } },
	]

	for (const block of input.instructionBlocks) {
		nodes.push({
			type: 'instruction_block',
			payload: {
				heading: block.heading,
				lines: block.lines,
				severity: block.severity,
			},
		})
	}

	nodes.push({
		type: 'expiration_note',
		payload: {
			expiresAt: input.expiresAt,
			revoked: input.revoked,
			language: input.language,
		},
	})

	return nodes
}
```
