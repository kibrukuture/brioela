import { AppContext } from '@/index';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { getDb } from '@/core/database/client';
import { updatePrivacySchema } from '@schnl/shared/validators/user.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function updatePrivacySettings(c: AppContext) {
	const body = await c.req.json();
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const privacyValidation = updatePrivacySchema.safeParse(body);
	if (!privacyValidation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: privacyValidation.error.issues[0].message });
	}

	const db = getDb();
	const [updatedUser] = await db
		.update(users)
		.set({ isDiscoverable: privacyValidation.data.isDiscoverable })
		.where(eq(users.id, user.id))
		.returning();

	return updatedUser;
}
