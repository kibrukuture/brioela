import { drizzle } from '@/database/sqlite/_database'
import * as brainSchema from '@/agents/brain/_schema'

export function createBrainDatabase(storage: DurableObjectStorage) {
	return drizzle(storage, { schema: brainSchema })
}
