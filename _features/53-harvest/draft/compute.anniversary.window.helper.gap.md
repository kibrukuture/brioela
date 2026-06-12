# Draft: compute.anniversary.window.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/harvest/compute.anniversary.window.helper.ts`

**Gap (feature 53):** Anniversary window — not calendar year-end.

**Source:** `brioela-specs/49-harvest.md` § Timing: Anniversary, Not December

---

```typescript
const MS_PER_DAY = 86_400_000

export type AnniversaryWindow = {
	yearIndex: number
	periodStart: number
	periodEnd: number
	composeAlarmAt: number
}

/**
 * Returns the anniversary year window ending at the upcoming account anniversary.
 * `composeAlarmAt` = one week before `periodEnd` (alarm fires in compose week).
 */
export function computeAnniversaryWindow(
	accountCreatedAt: number,
	now: number = Date.now(),
): AnniversaryWindow | null {
	if (now < accountCreatedAt) {
		return null
	}

	const msSinceCreation = now - accountCreatedAt
	const yearIndex = Math.floor(msSinceCreation / (365 * MS_PER_DAY)) + 1
	const periodStart = accountCreatedAt + (yearIndex - 1) * 365 * MS_PER_DAY
	const periodEnd = accountCreatedAt + yearIndex * 365 * MS_PER_DAY
	const composeAlarmAt = periodEnd - 7 * MS_PER_DAY

	return { yearIndex, periodStart, periodEnd, composeAlarmAt }
}
```
