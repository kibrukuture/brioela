# Draft: health insight Brain tools (gap)

Targets under `backend/src/agents/brain/_tools/_executables/`:

| Executable | Used by |
|---|---|
| `get.medications.for.health.insight.executable.ts` | HealthInsightAgent Pass 2 |
| `get.health.events.since.executable.ts` | Pass 1 |
| `get.health.captures.since.executable.ts` | Pass 1 + fingerprint metabolic bucket |
| `write.community.health.signal.executable.ts` | Pass 3 — Supabase RPC |

`get_memory_events_since` already specified in **12** / **15** — reuse for Pass 1 scan history.

Source: `03-health-insight-agent.md` capability subset.

## Policy

`_policies/health.insight.tool.policy.ts` — only `HealthInsightAgent` caller may invoke health insight executables. Unauthorized → `{ error: 'tool_not_authorized' }`.

## write_community_health_signal shape

```typescript
export type WriteCommunityHealthSignalInput = {
	anonymousHealthGroupId: string
	exposureKind: 'product' | 'ingredient' | 'food_category' | 'additive'
	exposureKey: string
	postExposureEventKind: string
	exposureCount: number
	postExposureEventCount: number
	onsetLagHours: number
	severity: number
	confidence: number
}
```

Calls `supabase.rpc('upsert_exposure_event_association', ...)` — never Brain SQLite.

## Public 17-tool set

Health insight reads are **not** exposed to `chat` sessions — maintenance-only pattern per **12**.
