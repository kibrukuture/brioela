# Draft: HealthInsightAgent — cross-feature gap (NOT feature 12)

**Owning feature:** **22-health-intelligence**

**Shipped:** No. Same Brain child sub-agent **pattern** as feature **12** trio, but health-specific alarm, capabilities, and community Postgres writes.

## What it is

Brain-owned ephemeral sub-agent DO started on `health_insight_run` alarm. Key pattern: `health_{userId}_{runId}` (per `build-guide/29-health-intelligence/03-health-insight-agent.md`).

## Relationship to BrioelaBrain

Same contract as **BrainMaintenanceAgent** / **BehaviorPatternAgent**:

- Spawned via `subAgent()` from Brain alarm dispatch (**14**)
- Reads bounded snapshot through typed Brain RPC — never imports Brain `_schemas/`
- Writes `user_memory` (`patterns.*`, `health.*`) and `schedule_user_alarm` via Brain
- Community tables via `write_community_health_signal` (Supabase RPC, not Brain SQLite)
- `sessions` row: `session_type: background`, `alarm_type: health_insight_run`

## Why not in feature 12

README **12** = maintenance, behavior pattern, compressor only. **22** owns HealthInsightAgent DO class, three passes (correlation, adherence, k-anonymity contribution), medication-adjacent reads, and first-boot seed for `health_insight_run`.

## Overlap with feature 12

| Shared | **12** only | **22** only |
|---|---|---|
| `subAgent()` spawn pattern | Skill/personality maintenance | Medication + health_events reads |
| `check_active_session` defer | `pattern.*` via BehaviorPatternAgent | k-anonymity ≥ 100, community Postgres |
| `schedule_user_alarm` self-reschedule | SessionContextCompressor | `health_insight.community_contribution_opt_in` |

## Intended production path

```
backend/src/agents/brain/_subagents/health-insight/
├── health.insight.agent.ts
├── run.health.insight.pass.handler.ts
├── health.insight.system.prompt.ts
└── index.ts
```

(Whether health lives under `brain/_subagents/` or sibling folder is **22** build decision — pattern matches **12**.)

## Sources read

- `build-guide/29-health-intelligence/00-overview.md`
- `build-guide/29-health-intelligence/03-health-insight-agent.md`
- `build-guide/29-health-intelligence/04-community-health-tables.md`
- `_features/22-health-intelligence/status.md`

## Blocked by

- **12-brain-sub-agents** spawn/RPC infrastructure (shared with **12** trio)
- **14-brain-alarm-dispatch** (`health_insight_run` case)
- Medical tables / Supabase community schema (**22**, **23**)
