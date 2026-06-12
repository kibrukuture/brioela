# Draft: auto.capture.alarm.handler.ts (gap — file does not exist)

Target: `backend/src/agents/bela/_handlers/auto.capture.alarm.handler.ts`

**Source:** `implementable-specs/bela/05-escrow-payment.md`, `15-checkout-payment.md`

---

```typescript
import type { BelaOrderAgent } from '../bela.order.agent'

const AUTO_CAPTURE_DELAY_MS = 10 * 60 * 1000

export async function scheduleAutoCaptureAlarm(
	agent: BelaOrderAgent,
	orderId: string,
): Promise<void> {
	const fireAt = Date.now() + AUTO_CAPTURE_DELAY_MS
	await agent.setAlarm(fireAt)
	await agent.env.SUPABASE.from('order_events').insert({
		order_id: orderId,
		kind: 'auto_capture_scheduled',
		payload_json: { fireAt },
		actor: 'orderagent',
	})
}
```
