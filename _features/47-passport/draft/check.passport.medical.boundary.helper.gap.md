# Draft: check.passport.medical.boundary.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/check.passport.medical.boundary.helper.ts`

**Gap (feature 47):** Block diagnosis, treatment, dosing, emergency protocol, medical-safety claims.

**Source:** `build-guide/28-passport/04-privacy-and-consent.md`, `brioela-specs/43-passport.md`

---

```typescript
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

const BLOCKED_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
	{ pattern: /\b(diagnos(e|is|ed)|prescrib(e|ed)|treat(ment)?)\b/i, reason: 'clinical_language' },
	{ pattern: /\b\d+\s*mg\b/i, reason: 'medication_dosing' },
	{ pattern: /\b(use epipen|call 911|emergency protocol)\b/i, reason: 'emergency_protocol' },
	{
		pattern: /\b(medically safe|doctor approved this restaurant)\b/i,
		reason: 'medical_safety_claim',
	},
]

export type MedicalBoundaryResult = {
	allowed: boolean
	violations: Array<{ field: string; reason: string }>
}

export function checkPassportMedicalBoundary(blocks: InstructionBlock[]): MedicalBoundaryResult {
	const violations: MedicalBoundaryResult['violations'] = []

	blocks.forEach((block, blockIndex) => {
		block.lines.forEach((line, lineIndex) => {
			for (const rule of BLOCKED_PATTERNS) {
				if (rule.pattern.test(line)) {
					violations.push({
						field: `blocks[${blockIndex}].lines[${lineIndex}]`,
						reason: rule.reason,
					})
				}
			}
		})
	})

	return { allowed: violations.length === 0, violations }
}
```
