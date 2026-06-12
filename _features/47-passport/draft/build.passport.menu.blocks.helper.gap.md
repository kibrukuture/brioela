# Draft: build.passport.menu.blocks.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/passport/build.passport.menu.blocks.helper.ts`

**Gap (feature 47):** `restaurant_menu` blocks from menu scan waiter questions + avoid rules (**26**).

**Source:** `build-guide/28-passport/06-feature-integration.md`, `17-menu-scanning/08-language-bridge.md`

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { PassportInstructionBlockSchema } from '@brioela/shared/validator/passport/passport.schema'
import type { z } from 'zod'

type InstructionBlock = z.infer<typeof passportInstructionBlockSchema>

export async function buildPassportMenuBlocks(
	database: BrainDatabase,
	userId: string,
	menuScanId: string | undefined,
): Promise<InstructionBlock[]> {
	// TODO(26): load menu_scan_session + dish verdicts for scan id
	// Pull yellow waiter questions → severity 'ask'
	// Pull red avoid rules → severity 'avoid' | 'critical'

	void database
	void userId

	if (!menuScanId) {
		return [
			{
				heading: 'For this meal',
				severity: 'ask',
				lines: ['Please confirm sauces and shared fryer use.'],
			},
		]
	}

	return [
		{
			heading: 'Avoid',
			severity: 'avoid',
			lines: ['Peanuts and peanut oil.'],
		},
		{
			heading: 'Question to ask',
			severity: 'ask',
			lines: [
				'Does this dish contain peanuts, peanut oil, or is it prepared near peanuts?',
			],
		},
	]
}
```
