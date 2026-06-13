import drizzle from '@brioela/shared/drizzle'
import postgres from 'postgres'
import * as schema from '@brioela/shared/drizzle/schema'

// Current: connects directly to Supabase transaction pooler (port 6543). Works correctly for CF Workers.
// Future — Cloudflare Hyperdrive: CF-side proxy that pre-warms connections inside CF's network,
// eliminating TCP handshake latency to Supabase on every request. Requires: (1) wrangler hyperdrive create,
// (2) HYPERDRIVE binding in wrangler.jsonc, (3) getDb(env: Env) signature change so callers pass env,
// (4) replace DATABASE_CONNECTION_STRING with env.HYPERDRIVE.connectionString, (5) prepare: true (Hyperdrive caches prepared statements).
// Add when latency to Supabase becomes a bottleneck. Local dev (wrangler dev) bypasses Hyperdrive and connects directly — no friction.
export function getDb() {
	const client = postgres(process.env.DATABASE_CONNECTION_STRING!, { prepare: false })
	return drizzle({ client, schema })
}
