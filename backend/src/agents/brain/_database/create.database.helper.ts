import { drizzle } from '@/database/sqlite/_database'
import * as brainSchema from '@/agents/brain/_schemas'

export function createDatabase(storage: DurableObjectStorage) {
	return drizzle(storage, { schema: brainSchema })
}
