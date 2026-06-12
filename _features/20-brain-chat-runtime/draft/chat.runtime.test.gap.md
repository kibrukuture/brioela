# Draft: chat.runtime.test.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/chat.runtime.test.ts`

**Gap (feature 20):** Workers pool E2E — open session → chat turn → `session_turns` row.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { BrioelaBrain } from '@/agents/brain/brioela.brain.agent'

describe('chat runtime', () => {
	it('writes a session_turn after one chat message', async () => {
		const id = env.BRIOELA_BRAIN.idFromName('chat-runtime-test-user')
		const stub = env.BRIOELA_BRAIN.get(id)

		const readiness = await stub.checkReadiness()
		expect(readiness.readiness.status).toBe('ready')

		const response = await stub.chat({
			message: 'Hello — what can you help me with today?',
		})

		expect(response.sessionId.length).toBeGreaterThan(0)
		expect(response.assistantMessage.length).toBeGreaterThan(0)

		// TODO(11): expose readSessionTurnsOrdered via test-only callable or direct DB probe
	})
})
```

Blocked until **11** session repos + **20** handlers exist. May mock `openSession` in earlier unit tests.
