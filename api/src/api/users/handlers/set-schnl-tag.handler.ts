import { AppContext } from '@/index';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { getDb } from '@/core/database/client';
import { setSchnlTagSchema } from '@schnl/shared/validators/user.validator';
import { assertSchnlTagAllowed } from '@/api/users/helpers';
import { HTTPException } from 'hono/http-exception';

export async function setSchnlTag(c: AppContext) {
	const body = await c.req.json();
	const user = c.get('user');
	if (!user) throw new HTTPException(401, { message: 'Unauthorized' });

	const schnlTagValidation = setSchnlTagSchema.safeParse(body);
	if (!schnlTagValidation.success) {
		throw new HTTPException(400, { message: schnlTagValidation.error.issues[0].message });
	}

	assertSchnlTagAllowed(schnlTagValidation.data.schnlTag);

	const db = getDb();
	const [currentUser] = await db.select({ schnlTag: users.schnlTag }).from(users).where(eq(users.id, user.id)).limit(1);
	if (currentUser?.schnlTag) {
		throw new HTTPException(409, { message: 'SchnlTag is already set. Contact support to change.' });
	}

	try {
		const [updatedUser] = await db
			.update(users)
			.set({ schnlTag: schnlTagValidation.data.schnlTag })
			.where(eq(users.id, user.id))
			.returning();
		return updatedUser;
	} catch (error: unknown) {
		if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === '23505') {
			throw new HTTPException(409, { message: 'This SchnlTag is already taken.' });
		}
		throw error;
	}
}
