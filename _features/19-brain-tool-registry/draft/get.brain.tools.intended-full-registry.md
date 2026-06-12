# Draft: get.brain.tools.ts — intended full registry (all 18 tools shipped)

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts`

**Not yet applied.** Assumes **06**, **07**, **16**, **18** tool files exist. Sub-agent kinds use empty public permissions (RPC in **12**).

```typescript
import { writeUserMemoryTool } from '@/agents/brain/_tools/write.user.memory.tool'
import { readUserMemoryTool } from '@/agents/brain/_tools/read.user.memory.tool'
import { logMemoryEventTool } from '@/agents/brain/_tools/log.memory.event.tool'
import { createUserSkillTool } from '@/agents/brain/_tools/create.user.skill.tool'
import { updateUserSkillTool } from '@/agents/brain/_tools/update.user.skill.tool'
import { viewUserSkillTool } from '@/agents/brain/_tools/view.user.skill.tool'
import { archiveUserSkillTool } from '@/agents/brain/_tools/archive.user.skill.tool'
import { deleteUserSkillTool } from '@/agents/brain/_tools/delete.user.skill.tool'
import { proposeUserConstraintTool } from '@/agents/brain/_tools/propose.user.constraint.tool'
import { confirmUserConstraintTool } from '@/agents/brain/_tools/confirm.user.constraint.tool'
import { viewUserRecipeTool } from '@/agents/brain/_tools/view.user.recipe.tool'
import { updateUserRecipeTool } from '@/agents/brain/_tools/update.user.recipe.tool'
import { archiveUserRecipeTool } from '@/agents/brain/_tools/archive.user.recipe.tool'
import { scheduleUserAlarmTool } from '@/agents/brain/_tools/schedule.user.alarm.tool'
import { cancelUserAlarmTool } from '@/agents/brain/_tools/cancel.user.alarm.tool'
import { loadSessionContextTool } from '@/agents/brain/_tools/load.session.context.tool'
import { searchSessionHistoryTool } from '@/agents/brain/_tools/search.session.history.tool'
import { searchWebTool } from '@/agents/brain/_tools/search.web.tool'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import type { SessionWebSearchCounter } from '@/agents/brain/_tools/_executables/search.web.executable'
import type { BrainDatabase } from '@/agents/brain/_database'
import { z } from '@brioela/shared/zod'

export const sessionKindSchema = z.enum([
	'chat',
	'cooking',
	'alarm',
	'brain_maintenance',
	'behavior_pattern_detection',
])
export type SessionKind = z.infer<typeof sessionKindSchema>

const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	chat: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'create_user_skill',
		'update_user_skill',
		'view_user_skill',
		'archive_user_skill',
		'delete_user_skill',
		'propose_user_constraint',
		'confirm_user_constraint',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'view_user_recipe',
		'update_user_recipe',
		'archive_user_recipe',
		'load_session_context',
		'search_session_history',
		'search_web',
	],
	cooking: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'create_user_skill',
		'update_user_skill',
		'view_user_skill',
		'archive_user_skill',
		'delete_user_skill',
		'propose_user_constraint',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'view_user_recipe',
		'update_user_recipe',
		'archive_user_recipe',
		'load_session_context',
		'search_session_history',
		'search_web',
	],
	alarm: [
		'log_memory_event',
		'write_user_memory',
		'load_session_context',
	],
	brain_maintenance: [],
	behavior_pattern_detection: [],
}

type SearchWebEnv = Pick<Env, 'TAVILY_API_KEY' | 'EXA_API_KEY'>

export function getBrainTools(
	db: BrainDatabase,
	userId: string,
	kind: SessionKind,
	activeSessionId: string | null = null,
	waitUntil?: (promise: Promise<void>) => void,
	wake?: AlarmWakeCallbacks,
	env?: SearchWebEnv,
	sessionWebSearchCounter?: SessionWebSearchCounter,
) {
	const allowed = new Set(TOOL_PERMISSIONS[kind])

	const all = {
		log_memory_event: logMemoryEventTool(db, userId, activeSessionId),
		write_user_memory: writeUserMemoryTool(db, userId),
		read_user_memory: readUserMemoryTool(db, userId, waitUntil),
		create_user_skill: createUserSkillTool(db, userId),
		update_user_skill: updateUserSkillTool(db, userId),
		view_user_skill: viewUserSkillTool(db, userId),
		archive_user_skill: archiveUserSkillTool(db, userId),
		delete_user_skill: deleteUserSkillTool(db, userId),
		propose_user_constraint: proposeUserConstraintTool(db, userId, activeSessionId),
		confirm_user_constraint: confirmUserConstraintTool(db, userId),
		schedule_user_alarm: wake ? scheduleUserAlarmTool(db, userId, wake) : undefined,
		cancel_user_alarm: wake ? cancelUserAlarmTool(db, userId, wake) : undefined,
		view_user_recipe: viewUserRecipeTool(db),
		update_user_recipe: updateUserRecipeTool(db, userId),
		archive_user_recipe: archiveUserRecipeTool(db),
		load_session_context: loadSessionContextTool(db, userId),
		search_session_history: searchSessionHistoryTool(db, userId),
		search_web:
			env && sessionWebSearchCounter
				? searchWebTool(db, userId, activeSessionId, env, sessionWebSearchCounter, waitUntil)
				: undefined,
	}

	return Object.fromEntries(
		Object.entries(all).filter(([name, tool]) => allowed.has(name) && tool !== undefined),
	)
}
```

**Future (**24**):** extend `sessionKindSchema` with `product_scan` and add permission row per spec **18** (`log_memory_event`, `write_user_memory`, `propose_user_constraint`, `search_web`).

**20** must pass: `activeSessionId`, `waitUntil`, `wake`, `env`, fresh `sessionWebSearchCounter = { count: 0 }`.
