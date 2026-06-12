# Draft: format.pending.alarms.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.pending.alarms.helper.ts`

**Gap (feature 15):** Block 7 formatter. Repository must exclude `session_watchdog`.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainScheduledAlarm } from '@/agents/brain/_schemas'

function formatScheduledAt(epochMs: number): string {
	return new Date(epochMs).toISOString()
}

function summarizePayload(payloadJson: string): string {
	try {
		const parsed = JSON.parse(payloadJson) as Record<string, unknown>
		const keys = Object.keys(parsed)
		if (keys.length === 0) return ''
		if (keys.length === 1 && typeof parsed[keys[0]!] === 'string') {
			return ` — ${String(parsed[keys[0]!])}`
		}
		return ` — ${JSON.stringify(parsed)}`
	} catch {
		return ''
	}
}

export function formatPendingAlarms(rows: BrainScheduledAlarm[]): string {
	const lines: string[] = [
		'## Pending reminders',
		'Agent-scheduled follow-ups still pending. Surface to the user when relevant.',
		'',
	]

	for (const row of rows) {
		const when = formatScheduledAt(row.scheduledAt)
		const payloadHint = summarizePayload(row.payload)
		lines.push(`- ${row.alarmType} @ ${when} (id: ${row.id})${payloadHint}`)
	}

	return lines.join('\n')
}
```

Source: `implementable-specs/brioela-tools/16-load-session-context.md` § Pending Alarms; `_features/09-brain-alarm-tools/spec.md`.
