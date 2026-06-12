# Draft: build.passport.mesa.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.mesa.blocks.helper.ts`

**Gap (feature 47):** `mesa_table` instruction blocks from active Food Audience (**41**).

**Source:** `build-guide/28-passport/01-passport-types.md`, `06-feature-integration.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export async function buildPassportMesaBlocks(
	database: BrainDatabase,
	userId: string,
	audience: 'self' | 'mesa' | 'selected_members' | 'guest_session',
): Promise<InstructionBlock[]> {
	// TODO(41): loadActiveFoodAudience + merge.constraints.for.audience
	// TODO(41): evaluateMesaCompatibility — per-member hard rules → generic lines
	// Default wording: "One person at this table avoids gluten strictly." — never member names

	void database
	void userId
	void audience

	return [
		{
			heading: 'For this table',
			severity: 'avoid',
			lines: ['One person at this table avoids peanuts strictly.'],
		},
		{
			heading: 'Please confirm',
			severity: 'ask',
			lines: ['shared fryer', 'sauce ingredients'],
		},
	]
}
```
