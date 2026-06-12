import { z } from '@brioela/shared/zod'

// DB column — 4 values, written to `sessions.session_type`
export const SESSION_TYPE_VALUES = ['chat', 'cooking', 'alarm', 'background'] as const
export const sessionTypeSchema = z.enum(SESSION_TYPE_VALUES)
export type SessionType = z.infer<typeof sessionTypeSchema>

// Tool permissions — 5 values, used by getBrainTools()
// `brain_maintenance` and `behavior_pattern_detection` both map to DB `background`
export const SESSION_KIND_VALUES = ['chat', 'cooking', 'alarm', 'brain_maintenance', 'behavior_pattern_detection'] as const
export const sessionKindSchema = z.enum(SESSION_KIND_VALUES)
export type SessionKind = z.infer<typeof sessionKindSchema>

// Canonical mapping: SessionKind (tool permissions) → session_type (DB)
export const SESSION_KIND_TO_TYPE: Record<SessionKind, SessionType> = {
	chat: 'chat',
	cooking: 'cooking',
	alarm: 'alarm',
	brain_maintenance: 'background',
	behavior_pattern_detection: 'background',
}
