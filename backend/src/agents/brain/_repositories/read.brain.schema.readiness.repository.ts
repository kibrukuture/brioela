import { brainSchemaReadiness, type BrainSchemaReadiness } from '@/agents/brain/_schema'
import type { BrainDatabase } from '@/agents/brain/_database'
import { eq } from '@/database/drizzle/_database'

export function readBrainSchemaReadiness(database: BrainDatabase): BrainSchemaReadiness | null {
	const readiness = database.select().from(brainSchemaReadiness).where(eq(brainSchemaReadiness.id, 'brain')).get()

	return readiness ?? null
}
