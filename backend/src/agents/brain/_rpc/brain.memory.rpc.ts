import type { BrainMemoryEvent } from '@/agents/brain/_schema'
import { z } from '@brioela/shared/zod'

export const appendBrainMemoryEventSchema = z
	.object({
		userId: z.string().trim().min(1),
		source: z.string().trim().min(1),
		kind: z.string().trim().min(1),
		payload: z.record(z.string(), z.json()),
		capturedAt: z.number().int().positive(),
		sessionId: z.string().trim().min(1).nullable(),
		entityKind: z.string().trim().min(1).nullable(),
		entityId: z.string().trim().min(1).nullable(),
		geoHash: z.string().trim().min(1).nullable(),
	})
	.strict()

export const brainMemoryEventCursorSchema = z
	.object({
		capturedAt: z.number().int().positive(),
		id: z.string().trim().min(1),
	})
	.strict()

export const listBrainMemoryEventsSchema = z
	.object({
		limit: z.number().int().min(1).max(100),
		cursor: brainMemoryEventCursorSchema.nullable(),
	})
	.strict()

export interface BrainMemoryEventAppend {
	event: BrainMemoryEvent
}

export interface BrainMemoryEvents {
	events: BrainMemoryEvent[]
	nextCursor: BrainMemoryEventCursor | null
}

export type AppendBrainMemoryEvent = z.infer<typeof appendBrainMemoryEventSchema>
export type BrainMemoryEventCursor = z.infer<typeof brainMemoryEventCursorSchema>

export type ListBrainMemoryEvents = z.infer<typeof listBrainMemoryEventsSchema>
