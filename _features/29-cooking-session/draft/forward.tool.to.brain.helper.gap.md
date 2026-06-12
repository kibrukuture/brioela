# Gap snapshot: forward-tool-to-brain.helper.ts

Target: `backend/src/agents/mira/_helpers/forward-tool-to-brain.helper.ts`

**Status:** Not in repo. Replaces implementable `fetch('/internal/tool-call')` with typed Brain RPC per `07-agent-framework-hardening.md`.

```typescript
import type { Env } from '@/types/env'
import type { MiraSessionState } from '../_types/mira.session.state.type'
import { COOKING_TO_BRAIN_TOOL_MAP } from '../_constants/cooking.tool.declarations'

export type MiraForwardToolInput = {
	tool: string
	args: unknown
}

export type MiraForwardToolResult = Record<string, unknown>

export async function forwardToolToBrain(
	input: MiraForwardToolInput,
	state: MiraSessionState,
	env: Env,
): Promise<MiraForwardToolResult> {
	const brainTool = COOKING_TO_BRAIN_TOOL_MAP[input.tool] ?? input.tool
	const brainId = env.BRAIN.idFromName(state.userId)
	const brain = env.BRAIN.get(brainId)

	const enrichedArgs =
		input.tool === 'write_session_note'
			? {
					event_type: 'session_note',
					source: 'cooking_agent',
					content: JSON.stringify({ note: (input.args as { note: string }).note }),
					session_id: state.sessionId,
				}
			: input.args

	const result = await brain.forwardMiraToolCall({
		caller: 'cooking',
		tool: brainTool,
		args: enrichedArgs,
		sessionId: state.sessionId,
	})

	return result as MiraForwardToolResult
}
