# Draft: HealthInsightAgent — gap (NOT feature 12)

**Owning feature:** **22-health-intelligence**

**Shipped:** No. Same Brain child sub-agent pattern as **12** trio.

## Identity

- Ephemeral DO: `backend/src/agents/brain/_subagents/health-insight/health.insight.agent.ts`
- Callable: `runHealthInsightPass({ userId, runId })`
- Key: `health_{userId}_{runId}`
- Alarm: `health_insight_run` (**14** dispatches; **22** owns body)

## Relationship to BrioelaBrain

Same contract as BrainMaintenanceAgent (**12**):

- `subAgent()` from `spawn.health.insight.handler.ts`
- Typed `parentAgent<BrioelaBrain>()` RPC — never direct SQLite
- Background `sessions` row before spawn
- Active-session guard → defer 1h

## Why not feature 12

**12** = maintenance, behavior pattern, compressor only. **22** owns HealthInsightAgent DO, three passes, community Postgres writes, `health_insight_run` seed.

## Three passes

1. **Food–health correlation** → `user_memory` `patterns.*`; community if opted in + k≥100
2. **Medication adherence** (7d `medication_reminder` outcomes) + med–food scan summary
3. **k-anonymous community contribution** → 8 Postgres tables or pending `agent_state`

## Authorized capabilities

See `spec.md` — `get_medications_for_health_insight`, `get_health_events_since`, `get_health_captures_since`, `get_memory_events_since`, `write_user_memory`, `schedule_user_alarm`, `write_community_health_signal`.

## Sources

- `build-guide/29-health-intelligence/03-health-insight-agent.md`
- `_features/12-brain-sub-agents/draft/health.insight.agent.gap.md` (catalog cross-ref)
