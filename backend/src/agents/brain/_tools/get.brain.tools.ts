import { writeUserMemoryTool } from '@/agents/brain/_tools/write.user.memory.tool'
import { readUserMemoryTool } from '@/agents/brain/_tools/read.user.memory.tool'
import { logMemoryEventTool } from '@/agents/brain/_tools/log.memory.event.tool'
import { viewUserRecipeTool } from '@/agents/brain/_tools/view.user.recipe.tool'
import { updateUserRecipeTool } from '@/agents/brain/_tools/update.user.recipe.tool'
import { archiveUserRecipeTool } from '@/agents/brain/_tools/archive.user.recipe.tool'
import { scheduleUserAlarmTool } from '@/agents/brain/_tools/schedule.user.alarm.tool'
import { cancelUserAlarmTool } from '@/agents/brain/_tools/cancel.user.alarm.tool'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import type { BrainDatabase } from '@/agents/brain/_database'
import { z } from '@brioela/shared/zod'

export const sessionKindSchema = z.enum(['chat', 'cooking', 'alarm', 'brain_maintenance', 'behavior_pattern_detection'])
export type SessionKind = z.infer<typeof sessionKindSchema>

const TOOL_PERMISSIONS: Record<SessionKind, string[]> = {
	chat: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'view_user_recipe',
		'schedule_user_alarm',
		'cancel_user_alarm',
	],
	cooking: [
		'log_memory_event',
		'write_user_memory',
		'read_user_memory',
		'view_user_recipe',
		'update_user_recipe',
		'archive_user_recipe',
		'schedule_user_alarm',
		'cancel_user_alarm',
	],
	alarm: [
		'log_memory_event',
		'write_user_memory',
	],
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

export function getBrainTools(
	db: BrainDatabase,
	userId: string,
	kind: SessionKind,
	activeSessionId: string | null = null,
	waitUntil?: (promise: Promise<void>) => void,
	wake?: AlarmWakeCallbacks,
) {
	const allowed = new Set(TOOL_PERMISSIONS[kind])

	const all = {
		log_memory_event: logMemoryEventTool(db, userId, activeSessionId),
		write_user_memory: writeUserMemoryTool(db, userId),
		read_user_memory: readUserMemoryTool(db, userId, waitUntil),
		view_user_recipe: viewUserRecipeTool(db),
		update_user_recipe: updateUserRecipeTool(db, userId),
		archive_user_recipe: archiveUserRecipeTool(db),
		schedule_user_alarm: wake ? scheduleUserAlarmTool(db, userId, wake) : undefined,
		cancel_user_alarm: wake ? cancelUserAlarmTool(db, userId, wake) : undefined,
	}

	return Object.fromEntries(
		Object.entries(all).filter(([name, tool]) => allowed.has(name) && tool !== undefined),
	)
}
