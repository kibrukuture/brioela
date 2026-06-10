import { writeUserMemoryTool } from '@/agents/brain/_tools/write.user.memory.tool'
import { readUserMemoryTool } from '@/agents/brain/_tools/read.user.memory.tool'
import { logMemoryEventTool } from '@/agents/brain/_tools/log.memory.event.tool'
import type { BrainDatabase } from '@/agents/brain/_database'

export type SessionCallerType = 'chat' | 'cooking' | 'alarm' | 'brain_maintenance' | 'behavior_pattern_detection'

const TOOL_PERMISSIONS: Record<SessionCallerType, string[]> = {
	chat: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
	],
	cooking: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
	],
	alarm: [
		'log_memory_event',
		'write_user_memory',
	],
	brain_maintenance: [
		'write_user_memory',
	],
	behavior_pattern_detection: [
		'log_memory_event',
		'write_user_memory',
	],
}

export function getToolsForSessionType(
	db: BrainDatabase,
	userId: string,
	caller: SessionCallerType,
	activeSessionId: string | null = null,
	waitUntil?: (promise: Promise<void>) => void,
) {
	const allowed = new Set(TOOL_PERMISSIONS[caller])

	const all = {
		log_memory_event: logMemoryEventTool(db, userId, activeSessionId),
		write_user_memory: writeUserMemoryTool(db, userId),
		read_user_memory: readUserMemoryTool(db, userId, waitUntil),
	}

	return Object.fromEntries(
		Object.entries(all).filter(([name]) => allowed.has(name)),
	)
}
