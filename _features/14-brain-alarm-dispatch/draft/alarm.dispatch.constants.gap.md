# Draft: alarm.dispatch.constants.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_constants/alarm.dispatch.constants.ts`

**Gap (feature 14 G13):** Max attempts and threshold constants not in codebase. Values below follow `17-session-lifecycle.md` + `10-scheduled-alarms.md` retry note — tunable product constants.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainSession } from '@/agents/brain/_schemas'

/** Handler-enforced per 10-scheduled-alarms.md — not in SQL CHECK. */
export const MAX_ALARM_ATTEMPTS = 3

/** Reclaim rows stuck in processing after DO crash. */
export const STALE_PROCESSING_MS = 30 * 60 * 1000

/** Per implementable-specs/17-session-lifecycle.md inactivity check at watchdog fire. */
export const SESSION_INACTIVITY_THRESHOLD_MS: Record<BrainSession['sessionType'], number> = {
	chat: 30 * 60 * 1000,
	cooking: 60 * 60 * 1000,
	alarm: 15 * 60 * 1000,
	background: 15 * 60 * 1000,
}
```

**Not defined here:** watchdog **schedule** durations (2h/8h/1h) — those live in **11** `open.session.handler.ts`.
