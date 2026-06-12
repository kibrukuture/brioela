# Draft: reminder-webhook.handler.ts (gap)

Target: `backend/src/api/health/reminder-webhook.handler.ts`

Source: `02-medication-reminders.md`

Vapi `end-of-call-report` → Brain `update-alarm-result` internal RPC.

```typescript
import type { AppContext } from '@/index'

type VapiWebhookPayload = {
	type: string
	call: {
		id: string
		metadata: { reminderId: string; userId: string }
	}
	transcript?: string
	analysis?: { structuredData?: { took?: number | null } }
	endedReason?: string
}

export async function handleReminderWebhook(c: AppContext): Promise<Response> {
	const body = (await c.req.json()) as VapiWebhookPayload

	if (body.type !== 'end-of-call-report') {
		return c.json({ ok: true })
	}

	const { reminderId, userId } = body.call.metadata
	const took = body.analysis?.structuredData?.took ?? null

	if (body.endedReason === 'no-answer' || body.endedReason === 'voicemail') {
		// triggerMedicationPush fallback; actionOutcomeStatus missed
		return c.json({ ok: true })
	}

	const brainId = c.env.BRAIN.idFromName(userId)
	const brain = c.env.BRAIN.get(brainId)
	await brain.fetch(
		new Request('https://internal/update-alarm-result', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${c.env.INTERNAL_SECRET}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				alarmId: reminderId,
				actionOutcomeStatus: 'answered',
				actionOutcomeJson: JSON.stringify({
					took,
					provider_call_id: body.call.id,
					answered_at: Date.now(),
					raw_end_reason: body.endedReason,
				}),
			}),
		}),
	)

	return c.json({ ok: true })
}
```

**Prefer structured `analysis.structuredData.took`** — not transcript substring parsing.
