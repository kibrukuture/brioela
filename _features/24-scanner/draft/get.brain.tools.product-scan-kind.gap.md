# Gap snapshot: product_scan SessionKind

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts`

**Status:** Not shipped. Deferred for MVP barcode API — required when live scan agent sessions need `search_web` in scan context (**18**).

---

## Current shipped enum

```typescript
export const sessionKindSchema = z.enum([
  'chat',
  'cooking',
  'alarm',
  'brain_maintenance',
  'behavior_pattern_detection',
])
```

## Intended addition (when scan agent ships)

```typescript
export const sessionKindSchema = z.enum([
  'chat',
  'cooking',
  'alarm',
  'brain_maintenance',
  'behavior_pattern_detection',
  'product_scan',
])

const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
  // ...existing...
  product_scan: [
    'log_memory_event',
    'read_user_memory',
    'search_web', // **18** — ingredient lookup not in stored data
  ],
}
```

**Boundary:** Barcode `POST /api/scans/resolve` does **not** require `product_scan` SessionKind — stateless Worker handler. SessionKind is for future conversational scan sessions (copilot **45**, agent-assisted label questions).

**Source:** `implementable-specs/brioela-tools/18-search-web.md`, `_features/18-brain-web-search/draft/get.brain.tools.web-search-permissions.gap.md`
