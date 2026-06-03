import { AppContext } from '@/index';
import { CheckSchnlTagResponse, checkSchnlTagSchema } from '@schnl/shared/validators/user.validator';
import { eq } from '@schnl/shared/drizzle';
import { getDb } from '@/core/database/client';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { assertSchnlTagAllowed } from '@/api/users/helpers';
import { HTTPException } from 'hono/http-exception';

export async function checkSchnlTagAvailability(c: AppContext): Promise<CheckSchnlTagResponse> {
	const query = c.req.query('tag');
	const tagAvailabilityValidation = checkSchnlTagSchema.safeParse({ tag: query });

	if (!tagAvailabilityValidation.success) {
		throw new HTTPException(400, { message: tagAvailabilityValidation.error.issues[0].message });
	}

	assertSchnlTagAllowed(tagAvailabilityValidation.data.tag);

	const db = getDb();
	const [existing] = await db.select().from(users).where(eq(users.schnlTag, tagAvailabilityValidation.data.tag)).limit(1);

	return { available: !existing };
}
