# Draft: order.state.machine.handler.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_handlers/order.state.machine.handler.ts`

**Source:** `implementable-specs/bela/01-order-creation.md`

---

```typescript
import type { BelaOrderAgentState } from '../_state/bela.order.agent.state'
import type { OrderStatus } from '@brioela/shared/validator/bela/order.schema'

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending: ['accepted', 'cancelled'],
	accepted: ['shopping', 'cancelled'],
	shopping: ['in_transit'],
	in_transit: ['delivered'],
	delivered: ['completed', 'disputed'],
	completed: [],
	disputed: ['refunded', 'completed'],
	cancelled: [],
	refunded: [],
}

export async function transitionOrderStatus(
	env: Env,
	state: BelaOrderAgentState,
	next: OrderStatus,
): Promise<void> {
	const allowed = ALLOWED_TRANSITIONS[state.status]
	if (!allowed.includes(next)) {
		throw new Error(`Invalid transition ${state.status} → ${next}`)
	}

	await env.SUPABASE.from('orders').update({ status: next }).eq('order_id', state.orderId)

	await env.SUPABASE.from('order_events').insert({
		order_id: state.orderId,
		kind: 'status_change',
		payload_json: { from: state.status, to: next },
		actor: 'orderagent',
	})

	state.status = next
}
```
