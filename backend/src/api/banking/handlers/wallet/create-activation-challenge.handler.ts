import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { authSignatureChallenges } from '@brioela/shared/drizzle/schema/auth-signature-challenges.schema';
import { eq } from '@brioela/shared/drizzle';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { createActivationChallengeSchema, createActivationChallengeResponseSchema } from '@brioela/shared/validators/challenge.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function createActivationChallenge(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const body = await c.req.json();
	const parsed = createActivationChallengeSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}
	const walletAddress = parsed.data.walletAddress;
	const db = getDb();
	const expiresAt = dayjs().add(2, 'minute').toDate();
	const nonce = nanoid(21);
	const purpose = 'activate_wallet';
	const [existing] = await db.select().from(authSignatureChallenges).where(eq(authSignatureChallenges.userId, user.id)).limit(1);
	if (existing && existing.usedAt == null && dayjs(existing.expiresAt).isAfter(dayjs())) {
		return {
			challengeId: existing.id,
			challenge: { nonce: existing.nonce, expiresAt: existing.expiresAt, purpose, address: walletAddress },
		};
	}
	const [created] = await db
		.insert(authSignatureChallenges)
		.values({
			userId: user.id,
			walletAddress,
			purpose,
			nonce,
			expiresAt,
		})
		.returning();
	const payload = {
		challengeId: created.id,
		challenge: { nonce, expiresAt, purpose, address: walletAddress },
	};
	return createActivationChallengeResponseSchema.parse(payload);
}
