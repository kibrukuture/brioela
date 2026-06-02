import type { AppContext } from '@/index';
import { and, eq, ilike, not, or, isNull } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { getDb } from '@/core/database/client';
import { normalizeUserSearchQuery, userSearchRequestSchema, type UserSearchResponse } from '@schnl/shared/validators/user-search.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function searchUsers(c: AppContext): Promise<UserSearchResponse> {
	const queryParam = c.req.query('query') ?? '';
	const limitParam = c.req.query('limit');
	const offsetParam = c.req.query('offset');

	const authUser = c.get('user');
	if (!authUser?.id) {
		throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	}

	const limit = typeof limitParam === 'string' ? Number.parseInt(limitParam, 10) : undefined;
	const offset = typeof offsetParam === 'string' ? Number.parseInt(offsetParam, 10) : undefined;

	const validation = userSearchRequestSchema.safeParse({
		query: queryParam,
		limit: Number.isNaN(limit) ? undefined : limit,
		offset: Number.isNaN(offset) ? undefined : offset,
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0].message });
	}

	const query = normalizeUserSearchQuery(validation.data.query);
	const limitValue = validation.data.limit ?? 5;
	const offsetValue = validation.data.offset ?? 0;

	const db = getDb();
	const q = `%${query}%`;

	const rows = await db
		.select({
			id: users.id,
			schnlTag: users.schnlTag,
			firstName: users.firstName,
			lastName: users.lastName,
			profilePicture: users.profilePicture,
		})
		.from(users)
		.where(
			and(
				not(eq(users.id, authUser.id)),
				eq(users.isDiscoverable, true),
				not(isNull(users.schnlTag)),
				or(ilike(users.schnlTag, q), ilike(users.email, q), ilike(users.phone, q))
			)
		)
		.limit(limitValue)
		.offset(offsetValue);

	const results = rows
		.filter((row) => typeof row.schnlTag === 'string' && row.schnlTag.length > 0)
		.map((row) => {
			const first = row.firstName?.trim() ?? '';
			const last = row.lastName?.trim() ?? '';
			const name = `${first} ${last}`.trim();

			return {
				id: row.id,
				schnlTag: row.schnlTag as string,
				name: name.length > 0 ? name : (row.schnlTag as string),
				profilePicture: row.profilePicture ?? null,
			};
		});

	return { results };
}
