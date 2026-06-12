# Draft: build.passport.caregiver.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.caregiver.blocks.helper.ts`

**Gap (feature 47):** `caregiver_school` snack/meal rules — no child name by default (**44**).

**Source:** `build-guide/28-passport/01-passport-types.md`, `06-feature-integration.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export async function buildPassportCaregiverBlocks(
	database: BrainDatabase,
	userId: string,
): Promise<InstructionBlock[]> {
	// TODO(07)(23): child member constraints if owner created via Mesa (**41**)
	// TODO(44): never include child name unless include_sensitive_detail
	// Parent controls sharing — no child account required

	void database
	void userId

	return [
		{
			heading: 'Snack rules',
			severity: 'avoid',
			lines: ['No peanuts or tree nuts.', 'No foods with undeclared shared fryer risk.'],
		},
		{
			heading: 'If unsure',
			severity: 'ask',
			lines: ['Contact parent before offering substitute snacks.'],
		},
	]
}
```
