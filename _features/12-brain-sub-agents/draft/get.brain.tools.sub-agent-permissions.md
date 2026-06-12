# Draft: get.brain.tools.ts — sub-agent permissions (partial shipped)

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts`

**Shipped:** `sessionKindSchema` includes `brain_maintenance` and `behavior_pattern_detection`. **Gap:** permissions drift from spec **15**; no `compressor` kind; maintenance-specific reads not registered.

---

## Production snapshot (shipped — 2025 migration)

```typescript
export const sessionKindSchema = z.enum(['chat', 'cooking', 'alarm', 'brain_maintenance', 'behavior_pattern_detection'])

const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	brain_maintenance: [
		'write_user_memory',
		'update_user_recipe',
		'archive_user_recipe',
		'schedule_user_alarm',
	],
	behavior_pattern_detection: [
		'log_memory_event',
		'write_user_memory',
		'schedule_user_alarm',
	],
}
```

## Spec 15 authoritative matrix (not shipped)

```typescript
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
compressor: [], // spec 17 — add when SessionKind extended
```

## Resolution path

Sub-agents should call **typed Brain RPC**, not live-session `getBrainTools()`. Registry update in **19** should align names; **12** ships RPC executables + `_policies/sub.agent.tool.policy.ts`.
