# Draft: sub.agent.tool.policy.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_policies/sub.agent.tool.policy.ts`

**Gap (feature 12):** Caller authorization matrix from spec **15** not enforced in production.

---

## Intended production file (full snapshot — not yet created)

```typescript
export type SubAgentCaller =
	| 'brain_maintenance'
	| 'behavior_pattern_detection'
	| 'compressor'
	| 'chat'
	| 'cooking'
	| 'alarm'

const TOOL_PERMISSIONS: Record<SubAgentCaller, readonly string[]> = {
	brain_maintenance: [
		'get_skills_for_brain_maintenance',
		'get_personality_traits_for_brain_maintenance',
		'get_user_memory_for_brain_maintenance',
		'update_user_skill',
		'archive_user_skill',
		'schedule_user_alarm',
		'update_personality_trait',
		'archive_personality_trait',
		'create_personality_trait',
	],
	behavior_pattern_detection: [
		'get_memory_events_since',
		'get_personality_traits_for_brain_maintenance',
		'get_user_memory_for_brain_maintenance',
		'write_user_memory',
		'schedule_user_alarm',
	],
	compressor: [],
	chat: [
		'write_user_memory',
		'read_user_memory',
		'log_memory_event',
		'propose_user_constraint',
		'confirm_user_constraint',
		'create_user_skill',
		'update_user_skill',
		'archive_user_skill',
		'schedule_user_alarm',
		'cancel_user_alarm',
		'search_session_history',
		'search_web',
	],
	cooking: [
		'write_user_memory',
		'create_user_skill',
		'log_memory_event',
		'view_user_recipe',
		'propose_user_constraint',
		'schedule_user_alarm',
		'search_web',
	],
	alarm: ['log_memory_event', 'write_user_memory'],
}

export function isToolAllowedForCaller(caller: SubAgentCaller, tool: string): boolean {
	return TOOL_PERMISSIONS[caller]?.includes(tool) ?? false
}

export function assertToolAllowedForCaller(caller: SubAgentCaller, tool: string): void {
	if (!isToolAllowedForCaller(caller, tool)) {
		throw new Error(JSON.stringify({ error: 'tool_not_authorized', tool, caller }))
	}
}
```

**Note:** Full chat/cooking matrices continue to evolve in **19** — sub-agent rows are **12** scope.
