# Draft: build.passport.bela.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.bela.blocks.helper.ts`

**Gap (feature 47):** `bela_shopper` substitution and scan-before-buy rules (**42**).

**Source:** `build-guide/28-passport/06-feature-integration.md`, `brioela-specs/43-passport.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export async function buildPassportBelaBlocks(
	database: BrainDatabase,
	userId: string,
	belaOrderId: string | undefined,
): Promise<InstructionBlock[]> {
	// TODO(42): load bela_order + active constraint profile for order audience
	// TODO(41): if Mesa audience on order, include table-level avoid rules

	void database
	void userId
	void belaOrderId

	return [
		{
			heading: 'Mesa order rules',
			severity: 'avoid',
			lines: ['No peanut products.'],
		},
		{
			heading: 'Substitutions',
			severity: 'info',
			lines: [
				'Use certified gluten-free substitutions only.',
				'If uncertain, scan replacement before buying.',
			],
		},
	]
}
```
