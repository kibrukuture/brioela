# Draft: medication-call.helper.ts (gap)

Target: `backend/src/api/health/medication-call.helper.ts`

Source: `build-guide/29-health-intelligence/02-medication-reminders.md`

```typescript
const VAPI_BASE = 'https://api.vapi.ai'

export type MedicationCallEnv = {
	VAPI_API_KEY: string
	VAPI_PHONE_NUMBER_ID: string
	ELEVENLABS_VOICE_ID: string
	WORKER_BASE_URL: string
	CALL_PROVIDER?: 'vapi' | 'bland'
}

export async function triggerMedicationCall(params: {
	phone: string
	drugName: string
	doseInfo: string
	reminderId: string
	userId: string
	env: MedicationCallEnv
}): Promise<void> {
	const { phone, drugName, doseInfo, reminderId, userId, env } = params

	// Update alarm via Brain internal RPC: actionOutcomeStatus calling

	const resp = await fetch(`${VAPI_BASE}/call`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.VAPI_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			phoneNumberId: env.VAPI_PHONE_NUMBER_ID,
			customer: { number: phone },
			assistant: {
				firstMessage: `Hi, this is your Brioela health reminder. It's time for your ${drugName} — ${doseInfo}. Did you take it? Please say yes or no.`,
				model: {
					provider: 'anthropic',
					model: 'claude-haiku-4-5-20251001',
					messages: [
						{
							role: 'system',
							content: `You are a health reminder assistant for Brioela. Keep it brief. Ask if the user took their ${drugName} (${doseInfo}). Never discuss medical advice. Never suggest dose changes.`,
						},
					],
				},
				voice: { provider: 'elevenlabs', voiceId: env.ELEVENLABS_VOICE_ID },
				endCallPhrases: ['goodbye', 'bye', 'thanks', 'thank you'],
				maxDurationSeconds: 60,
			},
			metadata: { reminderId, userId, drugName },
			serverUrl: `${env.WORKER_BASE_URL}/api/health/reminder-webhook`,
		}),
	})

	if (!resp.ok) {
		await triggerMedicationPush({ drugName, doseInfo, reminderId, userId })
		// update alarm: notified + fallback flag
	}
}
```

Call frequency: max 1 call / 4h / user; no calls 22:00–07:00 local.
