# Draft: build.passport.practitioner.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.practitioner.blocks.helper.ts`

**Gap (feature 47):** `practitioner_guidance` from user-approved annotations (**46**).

**Source:** `build-guide/28-passport/06-feature-integration.md`, `brioela-specs/43-passport.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export async function buildPassportPractitionerBlocks(
	database: BrainDatabase,
	userId: string,
	annotationIds: string[],
): Promise<InstructionBlock[]> {
	// TODO(46): verify practitioner_client_relationship active + scope includes food notes
	// TODO(23): load practitioner_condition_annotations by id — user-approved only
	// Hide practitioner/client relationship details by default

	void database
	void userId
	void annotationIds

	return [
		{
			heading: 'Food guidance',
			severity: 'info',
			lines: ['Prefer consistent vitamin K from leafy greens with this meal plan.'],
		},
	]
}
```
