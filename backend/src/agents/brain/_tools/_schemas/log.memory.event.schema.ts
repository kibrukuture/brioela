import { z } from '@brioela/shared/zod'
import { jsonValueSchema } from '@/agents/brain/_tools/_schemas/json.value.schema'

export const logMemoryEventSchema = z.object({
	kind: z.string().min(1).describe('What kind of event this is: e.g. food_intake, symptom_reported.'),
	payload: z.record(z.string(), jsonValueSchema).describe('The event data. Structure is free.'),
	captured_at: z.number().int().positive().optional().describe('Unix timestamp in ms when it occurred.'),
	source: z.string().min(1).describe('Who is logging this event: e.g. agent.'),
	entity_kind: z.string().optional().describe('What category of thing this is about: e.g. food.'),
	entity_id: z.string().optional().describe('The specific entity: e.g. recipe-id.'),
	geo_hash: z.string().optional().describe('Geohash of where the event occurred.'),
})
