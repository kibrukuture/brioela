# Draft: compute.lookback.window.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/sift/compute.lookback.window.helper.ts`

**Source:** `build-guide/16-illness-detective/02-lookback-window.md`, spec 30.

---

```typescript
import { readCurrentEpochMs } from '@/time/_helpers'

const HOUR_MS = 60 * 60 * 1000
const MAX_LOOKBACK_HOURS = 72

export type LookbackWindow = {
	windowStart: number
	windowEnd: number
	mealScope: 'last_meal' | 'last_2_3_meals' | 'full_72h'
}

export function computeLookbackWindow(symptomOnsetHours: number, nowMs = readCurrentEpochMs()): LookbackWindow {
	const onsetHours = Math.min(Math.max(symptomOnsetHours, 0), MAX_LOOKBACK_HOURS)
	const windowEnd = nowMs
	const windowStart = nowMs - MAX_LOOKBACK_HOURS * HOUR_MS

	if (onsetHours <= 6) {
		return {
			windowStart: nowMs - 6 * HOUR_MS,
			windowEnd,
			mealScope: 'last_meal',
		}
	}

	if (onsetHours <= 24) {
		return {
			windowStart: nowMs - 24 * HOUR_MS,
			windowEnd,
			mealScope: 'last_2_3_meals',
		}
	}

	return {
		windowStart,
		windowEnd,
		mealScope: 'full_72h',
	}
}
```

`mealScope` is passed to `buildSiftContext` to filter meal-grouped events — full `memory_event` query still uses `[windowStart, windowEnd]`.
