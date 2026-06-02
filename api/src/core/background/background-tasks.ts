import type { AppContext } from '@/index';

/**
 * Run a function in the background (fire-and-forget)
 * Works the same in local and production:
 * - Production (Cloudflare Workers): Uses native waitUntil()
 * - Local: Uses setImmediate() as fallback
 *
 * Same behavior as waitUntil() - non-blocking, doesn't await
 */
export function runInBackground(c: AppContext, fn: () => Promise<void>): void {
	// Check if Cloudflare ExecutionContext.waitUntil is available
	if (c.executionCtx?.waitUntil) {
		// Production (Cloudflare Workers): Use native waitUntil
		c.executionCtx.waitUntil(fn());
	} else {
		// Local: Use setImmediate (same behavior - fire-and-forget)
		setImmediate(() => {
			fn().catch((err) => {
				console.error('Background task error:', err);
			});
		});
	}
}
