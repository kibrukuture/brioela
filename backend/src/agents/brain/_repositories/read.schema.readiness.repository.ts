import { brainSchemaReadiness, type BrainSchemaReadiness } from '@/agents/brain/_schemas'
import type { BrainDatabase } from '@/agents/brain/_database'
import { eq, getOne } from '@/database/drizzle/_database'

export function readSchemaReadiness(database: BrainDatabase): BrainSchemaReadiness | null {
	return getOne(database.select().from(brainSchemaReadiness).where(eq(brainSchemaReadiness.id, 'brain')))
}
