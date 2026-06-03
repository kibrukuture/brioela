import { Context, Next } from 'hono';
import { getSupabaseAdmin } from '@/core/database/supabase-admin-client';
import { apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';

interface AuthMiddlewareOptions {
	skipRoutes?: string[]; // routes to skip authentication
}
export const authMiddleware = (authMiddlewareOptions: AuthMiddlewareOptions) => {
	const log = console.log;
	const errlog = console.error;

	return async (c: Context, next: Next) => {
		const requestPath = new URL(c.req.url).pathname;

		// Check if current route should skip auth
		const shouldSkip = authMiddlewareOptions.skipRoutes?.some((route) => {
			if (route === requestPath) return true; // Exact match

			if (route.endsWith('/*')) {
				// Wildcard
				const baseRoute = route.slice(0, -2); // eg. "/api/webhooks/*" -> "/api/webhooks"
				return requestPath.startsWith(baseRoute);
			}

			return false;
		});

		if (shouldSkip) {
			log(`[AuthMiddleware] Skipping auth for allowed route: ${requestPath}`);
			await next();
			return;
		}

		log(`[AuthMiddleware] Processing request for: ${c.req.url}`);

		try {
			// --- 1. Extract token from Authorization header ---
			const authHeader = c.req.header('Authorization');
			const token = authHeader?.split(' ')[1];

			if (!token) {
				log('[AuthMiddleware] Auth failed: No token provided');
				return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Authentication required: No token provided.'), 401);
			}

			// --- 2. Validate token via Supabase ---
			const supabase = getSupabaseAdmin();
			const {
				data: { user },
				error: getUserError,
			} = await supabase.auth.getUser(token);

			if (getUserError || !user) {
				errlog('[AuthMiddleware] Auth Error:', getUserError?.message || 'User not found for token');
				return c.json(apiErrorResponse(ErrorCode.UNAUTHORIZED, 'Authentication failed: Invalid token or user session.'), 401);
			}

			const userIdFromToken = user.id;

			// --- 3. Get user_id from query params ---
			const userIdFromQuery = c.req.query('userId') as string;

			if (!userIdFromQuery) {
				errlog(`[AuthMiddleware] Missing user_id query parameter`);
				return c.json(apiErrorResponse(ErrorCode.INVALID_INPUT, 'Bad Request: Missing required user_id query parameter'), 400);
			}

			// --- 4. Compare user IDs ---
			if (userIdFromQuery !== userIdFromToken) {
				errlog(`[AuthMiddleware] Forbidden: Token user ${userIdFromToken} ≠ query user ${userIdFromQuery}`);
				return c.json(apiErrorResponse(ErrorCode.FORBIDDEN, 'Forbidden: User ID mismatch.'), 403);
			}

			// --- 5. Attach user info to context ---
			c.set('user', {
				id: userIdFromToken,
				email: user.email ?? null,
			});

			log(`[AuthMiddleware] Auth success for user: ${userIdFromToken}`);
			await next();
		} catch (e: unknown) {
			errlog('[AuthMiddleware] Unexpected Error:', e);
			return c.json(apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Internal Server Error during authentication check'), 500);
		}
	};
};
