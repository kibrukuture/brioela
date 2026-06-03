import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { users } from '@brioela/shared/drizzle/schema/user.schema';
import { eq } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';

export async function getUserById(c: AppContext) {
	const id = c.req.param('id');
	const db = getDb();
	const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
	if (!user) {
		throw new HTTPException(404, { message: 'User not found' });
	}
	return user;
}
