# Draft: evaluate.delivery.rules.helper.ts (gap)

Target: `backend/src/agents/brain/_helpers/evaluate.delivery.rules.helper.ts`

Source: `build-guide/12-notifications/01-priority-model.md`, `02-delivery-rules.md`, `03-suppression-state.md`

---

## Intended production file

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import type { NotificationPriority } from '@/core/notifications/send-platform-push'

export type DeliveryRuleInput = {
	userId: string
	notificationType: string
	priority: NotificationPriority
	nowMs: number
	userTimezoneOffsetMinutes: number // from profile / geohash
}

export type DeliveryRuleResult =
	| { action: 'send' }
	| { action: 'queue'; earliestDeliverAtMs: number; reason: string }
	| { action: 'suppress'; reason: string }
	| { action: 'skip'; reason: string }

const QUIET_HOURS_START = 23 // 11pm local
const QUIET_HOURS_END = 7 // 7am local

export async function evaluateDeliveryRules(
	database: BrainDatabase,
	input: DeliveryRuleInput,
): Promise<DeliveryRuleResult> {
	if (input.priority === 'low') {
		return { action: 'skip', reason: 'low_priority_no_push' }
	}

	if (input.priority === 'critical') {
		return { action: 'send' }
	}

	// TODO: read notification_suppression for input.notificationType
	// TODO: read medium push count for local calendar day — max 1
	// TODO: detect active voice/cooking/live-scan/Bela session — queue if active

	const localHour = /* derive from nowMs + offset */
	if (input.priority !== 'critical' && isQuietHours(localHour)) {
		return { action: 'queue', earliestDeliverAtMs: nextQuietHoursEnd(input), reason: 'quiet_hours' }
	}

	return { action: 'send' }
}

function isQuietHours(localHour: number): boolean {
	return localHour >= QUIET_HOURS_START || localHour < QUIET_HOURS_END
}
```

Full implementation requires **11** active session query and Brain suppression repository.
