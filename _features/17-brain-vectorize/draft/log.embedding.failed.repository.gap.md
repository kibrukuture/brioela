# Draft: log.embedding.failed.repository.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_repositories/log.embedding.failed.repository.ts`

**Gap (feature 17):** Persist embedding failures to `agent_state` for future retry workflow.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainDatabase } from '@/agents/brain/_database'
import { agentState } from '@/agents/brain/_schemas/agent.state.schema'
import { readCurrentEpochMs } from '@/time/_helpers'

export function logEmbeddingFailed(
	db: BrainDatabase,
	userId: string,
	sessionId: string,
	err: unknown,
): void {
	const now = readCurrentEpochMs()
	const message = err instanceof Error ? err.message : String(err)

	db.insert(agentState)
		.values({
			key: `embedding.failed.${sessionId}`,
			userId,
			value: JSON.stringify({
				error: message,
				session_id: sessionId,
				ts: now,
			}),
			updatedAt: now,
		})
		.run()
}
```

**Retry:** Future Upstash Workflow scans keys matching `embedding.failed.*` — not Brain maintenance (Path B, event-based per `18-vectorize.md`).

**Dual-write:** Session SQLite row remains correct; only vector missing.

Export from `_repositories/index.ts`.
