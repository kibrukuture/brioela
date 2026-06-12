# Gap snapshot: recall.routes.ts

Target: `shared/routes/recall.routes.ts`

**Status:** Not in repo. From `build-guide/02-coding-standards/01-monorepo-and-folder-structure.md`.

---

```typescript
const RECALL_BASE = '/api/recall' as const

export const RECALL_ROUTES = {
  base: RECALL_BASE,
  alerts: `${RECALL_BASE}/alerts`,
  alertById: (matchId: string) => `${RECALL_BASE}/alerts/${matchId}`,
  resolveAlert: (matchId: string) => `${RECALL_BASE}/alerts/${matchId}/resolve`,
} as const

export const RECALL_ROUTE_PATTERNS = {
  base: RECALL_BASE,
  alerts: `${RECALL_BASE}/alerts`,
  alertById: `${RECALL_BASE}/alerts/:matchId`,
  resolveAlert: `${RECALL_BASE}/alerts/:matchId/resolve`,
} as const

export const BRAIN_INTERNAL_RECALL_ROUTES = {
  recallMatch: '/internal/recall-match',
  recallRetraction: '/internal/recall-retraction',
} as const
```

**QStash job routes (Worker — not mobile):**

```typescript
export const RECALL_JOB_ROUTES = {
  pollFeeds: '/jobs/recall/poll-feeds',
  matchEntry: '/jobs/recall/match-entry',
  checkOnScan: '/jobs/recall/check-on-scan',
} as const
```
