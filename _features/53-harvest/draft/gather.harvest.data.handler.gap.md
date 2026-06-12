# Draft: gather.harvest.data.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/gather.harvest.data.handler.ts`

**Gap (feature 53):** Step 1 — gather year's signals (never named "harvest" as verb).

**Source:** `brioela-specs/49-harvest.md` § Composition step 1, `brioela-specs/38-food-time-machine.md` § Data Sources

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { gatherScanSignals } from '@/agents/brain/_helpers/harvest/gather.scan.signals.helper'
import { gatherRecipeSignals } from '@/agents/brain/_helpers/harvest/gather.recipe.signals.helper'
import { gatherReceiptSignals } from '@/agents/brain/_helpers/harvest/gather.receipt.signals.helper'
import { gatherConstraintSignals } from '@/agents/brain/_helpers/harvest/gather.constraint.signals.helper'
import { gatherHeritageSignals } from '@/agents/brain/_helpers/harvest/gather.heritage.signals.helper'
import { gatherFamilySignals } from '@/agents/brain/_helpers/harvest/gather.family.signals.helper'
import { loadTimeMachineArchive } from '@/agents/brain/_helpers/harvest/load.time.machine.archive.helper'

export type HarvestGatherBundle = {
	periodStart: number
	periodEnd: number
	scans: Awaited<ReturnType<typeof gatherScanSignals>>
	recipes: Awaited<ReturnType<typeof gatherRecipeSignals>>
	receipts: Awaited<ReturnType<typeof gatherReceiptSignals>>
	constraints: Awaited<ReturnType<typeof gatherConstraintSignals>>
	heritage: Awaited<ReturnType<typeof gatherHeritageSignals>>
	family: Awaited<ReturnType<typeof gatherFamilySignals>>
	timeMachineArchive: Awaited<ReturnType<typeof loadTimeMachineArchive>>
}

export async function gatherHarvestData(
	db: BrainDatabase,
	userId: string,
	periodStart: number,
	periodEnd: number,
): Promise<HarvestGatherBundle> {
	const [scans, recipes, receipts, constraints, heritage, family, timeMachineArchive] =
		await Promise.all([
			gatherScanSignals(db, userId, periodStart, periodEnd),
			gatherRecipeSignals(db, userId, periodStart, periodEnd),
			gatherReceiptSignals(db, userId, periodStart, periodEnd),
			gatherConstraintSignals(db, userId, periodStart, periodEnd),
			gatherHeritageSignals(db, userId, periodStart, periodEnd),
			gatherFamilySignals(db, userId, periodStart, periodEnd),
			loadTimeMachineArchive(db, userId, periodStart, periodEnd),
		])

	return {
		periodStart,
		periodEnd,
		scans,
		recipes,
		receipts,
		constraints,
		heritage,
		family,
		timeMachineArchive,
	}
}
```
