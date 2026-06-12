# Draft: trigger.harvest.edition.notification.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/harvest/trigger.harvest.edition.notification.handler.ts`

**Gap (feature 53):** One `harvest_edition_ready` notification — never re-pushed.

**Source:** `brioela-specs/49-harvest.md` § Technical Constraints; **21** spec inventory

---

```typescript
import type { BrainDatabase } from '@/agents/brain/_database/brain.database'
import { queueNotification } from '@/agents/brain/_handlers/notifications/queue.notification.handler'

export async function triggerHarvestEditionNotification(
	db: BrainDatabase,
	userId: string,
	editionId: string,
): Promise<void> {
	await queueNotification(db, {
		userId,
		type: 'harvest_edition_ready',
		priority: 'medium',
		dedupeKey: `harvest_edition:${editionId}`,
		title: 'Your Harvest is ready',
		body: 'Your year in food — composed and waiting.',
		data: {
			type: 'harvest_edition_ready',
			editionId,
		},
		allowRepeat: false,
	})
}
```
