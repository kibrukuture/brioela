# Draft: get.brain.tools.ts (memory tools excerpt)

Target: `backend/src/agents/brain/_tools/get.brain.tools.ts` — memory-related portion only. Full file also registers recipe and alarm tools (features 10, 11).

```typescript
const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	chat: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		// ... recipe + alarm tools
	],
	cooking: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		// ...
	],
	alarm: [
		'log_memory_event',
		'write_user_memory',
	],
	brain_maintenance: [
		'write_user_memory',
		// ...
	],
	behavior_pattern_detection: [
		'log_memory_event',
		'write_user_memory',
		// ...
	],
}

// Inside getBrainTools():
const all = {
	log_memory_event: logMemoryEventTool(db, userId, activeSessionId),
	write_user_memory: writeUserMemoryTool(db, userId),
	read_user_memory: readUserMemoryTool(db, userId, waitUntil),
	// ...
}
```
