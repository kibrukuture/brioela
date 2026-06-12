# Draft: scan.session.handler.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_handlers/scan.session.handler.ts`

**Source:** `implementable-specs/bela/04-live-scan-session.md`

---

```typescript
import type { BelaOrderAgentState } from '../_state/bela.order.agent.state'
import { checkConstraintForOrder } from '../_helpers/check.constraint.for.order.helper'
import { broadcastScanResult } from '../_helpers/broadcast.scan.result.helper'
import { appendOrderEvent } from '../_helpers/append.order.event.helper'
import { z } from 'zod'

const shopperScanPayloadSchema = z.object({
	barcode: z.string().optional(),
	productId: z.string().optional(),
	product: z.object({
		brand: z.string(),
		ingredients: z.array(z.string()),
		attributes: z.array(z.string()),
	}),
	orderItemId: z.string().uuid().optional(),
})

export async function handleScanSessionMessage(
	env: Env,
	state: BelaOrderAgentState,
	_ws: WebSocket,
	role: 'user' | 'shopper',
	raw: string | ArrayBuffer,
): Promise<void> {
	if (role !== 'shopper') return

	const parsed = shopperScanPayloadSchema.safeParse(JSON.parse(String(raw)))
	if (!parsed.success) return

	const constraint = checkConstraintForOrder(parsed.data.product, state.constraintSnapshot)

	const resultCard = {
		orderId: state.orderId,
		constraint,
		scannedAt: Date.now(),
		product: parsed.data.product,
	}

	await appendOrderEvent(env, {
		orderId: state.orderId,
		kind: constraint.blocked ? 'scanner_block' : 'item_scanned',
		payload: resultCard,
		actor: 'shopper',
	})

	broadcastScanResult(state, resultCard)
}
```
