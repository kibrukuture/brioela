# Draft: trigger-medication-push.helper.ts (gap)

Target: `backend/src/core/notifications/trigger-medication-push.helper.ts`

Source: `build-guide/29-health-intelligence/02-medication-reminders.md`

**Owner split:** **22** invokes; **21** owns send shape and provider call.

---

## Intended production file

```typescript
import { sendPlatformPush } from '@/core/notifications/send-platform-push';

export async function triggerMedicationPush(params: {
	drugName: string;
	doseInfo: string;
	reminderId: string;
	userId: string;
}): Promise<void> {
	const { drugName, doseInfo, reminderId, userId } = params;

	const result = await sendPlatformPush({
		userId,
		type: 'medication_reminder',
		priority: 'high',
		title: `Time for your ${drugName}`,
		body: `${drugName} ${doseInfo} — tap to confirm you took it.`,
		idempotencyKey: reminderId,
		collapseId: `medication_reminder:${reminderId}`,
		ttlSeconds: 3600,
		data: {
			type: 'medication_reminder',
			drug_name: drugName,
			alarm_id: reminderId,
		},
	});

	if (result.status === 'suppressed' || result.status === 'skipped') {
		// Log — medication reminders should rarely suppress; consider critical elevation for high-stakes only via call path
		console.warn('medication push not sent', { userId, reminderId, result });
	}
}
```

Build guide shows raw OneSignal REST — **do not ship duplicate** in **22** handler.
