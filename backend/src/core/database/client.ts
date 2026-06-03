import drizzle from '@brioela/shared/drizzle';
import { Pool } from 'node_modules/@types/pg';
import { schema } from '@brioela/shared/drizzle/schema';

/**
 * Create database client with optimized connection pool configuration
 * Phase 5: Connection Pool Configuration
 *
 * Configuration:
 * - max: 30 connections (increased from default ~10)
 * - min: 5 idle connections (keeps connections warm)
 * - idleTimeoutMillis: 30000 (close idle connections after 30s)
 * - connectionTimeoutMillis: 5000 (timeout after 5s if no connection available)
 * - maxUses: 1 (required for Cloudflare Workers)
 */
export function getDb() {
	const pool = new Pool({
		connectionString: process.env.DATABASE_CONNECTION_STRING,
		max: 30, // Maximum number of connections in the pool
		min: 5, // Minimum number of idle connections to maintain
		idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
		connectionTimeoutMillis: 5000, // Timeout after 5 seconds if no connection is available
		maxUses: 1, // Required for Cloudflare Workers - connections are single-use
	});

	return drizzle({ client: pool, schema });
}
