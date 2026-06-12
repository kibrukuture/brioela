# Draft: minimize.passport.privacy.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/minimize.passport.privacy.helper.ts`

**Gap (feature 47):** Default redactions and safe rewrites before preview/render.

**Source:** `build-guide/28-passport/04-privacy-and-consent.md`, `brioela-specs/43-passport.md`

---

```typescript
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export type MinimizePassportPrivacyInput = {
	includeSensitiveDetail: boolean
}

export type MinimizePassportPrivacyResult = {
	blocks: InstructionBlock[]
	sensitivity: 'public_safe' | 'limited_sensitive' | 'blocked'
	redactions: Array<{ field: string; reason: string }>
}

const CHILD_NAME_PATTERN = /\b(my (child|son|daughter|kid) )?[A-Z][a-z]+\b/g
const CONDITION_NAME_PATTERN =
	/\b(celiac disease|type 2 diabetes|peanut allergy|anaphylaxis)\b/gi

export function minimizePassportPrivacy(
	blocks: InstructionBlock[],
	input: MinimizePassportPrivacyInput,
): MinimizePassportPrivacyResult {
	const redactions: MinimizePassportPrivacyResult['redactions'] = []
	let sensitivity: MinimizePassportPrivacyResult['sensitivity'] = 'public_safe'

	const scrubbed = blocks.map((block, blockIndex) => {
		const lines = block.lines.map((line, lineIndex) => {
			let next = line

			if (!input.includeSensitiveDetail && CHILD_NAME_PATTERN.test(line)) {
				redactions.push({
					field: `blocks[${blockIndex}].lines[${lineIndex}]`,
					reason: 'child_name_removed',
				})
				next = next.replace(CHILD_NAME_PATTERN, 'the child')
				sensitivity = 'limited_sensitive'
			}

			if (!input.includeSensitiveDetail && CONDITION_NAME_PATTERN.test(line)) {
				redactions.push({
					field: `blocks[${blockIndex}].lines[${lineIndex}]`,
					reason: 'condition_name_generalized',
				})
				next = next.replace(/celiac disease/gi, 'strict gluten avoidance required')
				next = next.replace(/peanut allergy/gi, 'strict peanut avoidance required')
			}

			return next
		})

		return { ...block, lines }
	})

	return { blocks: scrubbed, sensitivity, redactions }
}
```
