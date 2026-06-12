# Draft: build.passport.travel.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.travel.blocks.helper.ts`

**Gap (feature 47):** `travel_translation` from confirmed rules + **35** destination language hints only.

**Source:** `build-guide/28-passport/05-translation-and-display.md`, `06-feature-integration.md`

**Boundary:** Does **not** run travel preload — reads active `travel_intent` if present (**35**).

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export async function buildPassportTravelBlocks(
	database: BrainDatabase,
	userId: string,
	travelIntentId: string | undefined,
): Promise<InstructionBlock[]> {
	// TODO(35): load travel_intent for destination primary language hint
	// TODO(07)(23): confirmed constraints → food-rule lines only
	// Translation applied later in translate.passport.blocks.helper — not here

	void database
	void userId
	void travelIntentId

	return [
		{
			heading: 'Please avoid',
			severity: 'avoid',
			lines: ['Wheat, barley, rye, and shared fryer preparation.'],
		},
		{
			heading: 'Question to ask',
			severity: 'ask',
			lines: ['Is this prepared with wheat flour or in a shared fryer?'],
		},
	]
}
```
