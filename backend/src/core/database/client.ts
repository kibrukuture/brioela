import drizzle from '@brioela/shared/drizzle'
import postgres from 'postgres'
import * as schema from '@brioela/shared/drizzle/schema'

export function getDb() {
	const client = postgres(process.env.DATABASE_CONNECTION_STRING!, { prepare: false })
	return drizzle({ client, schema })
}
