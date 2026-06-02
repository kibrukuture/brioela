import { getDb } from '@/core/database/client';
import { authSignatureChallenges } from '@schnl/shared/drizzle/schema/auth-signature-challenges.schema';
import { eq } from '@schnl/shared/drizzle';
import dayjs from 'dayjs';
import { getThirdWebClient } from '@/core/clients/third-web';
import { verifySignature } from 'thirdweb/auth';
import { polygon } from 'thirdweb/chains';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

function assertChallengeValid(
	challenge: {
		userId: string;
		usedAt: Date | null;
		expiresAt: Date;
		purpose: string;
		walletAddress: string;
	},
	params: { userId: string; walletAddress: string }
) {
	if (challenge.userId !== params.userId) {
		throw new HTTPException(ErrorCode.FORBIDDEN, { message: 'Invalid challenge owner' });
	}
	if (challenge.usedAt) {
		throw new HTTPException(ErrorCode.CONFLICT, { message: 'Challenge already used' });
	}
	if (!dayjs(challenge.expiresAt).isValid() || dayjs(challenge.expiresAt).isBefore(dayjs())) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Challenge expired' });
	}
	if (challenge.purpose !== 'activate_wallet') {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Invalid challenge purpose' });
	}
	if (challenge.walletAddress !== params.walletAddress) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Challenge wallet mismatch' });
	}
}

function buildChallengeMessage(challenge: { nonce: string; expiresAt: Date; purpose: string; walletAddress: string }) {
	return JSON.stringify({
		nonce: challenge.nonce,
		expiresAt: challenge.expiresAt,
		purpose: challenge.purpose,
		address: challenge.walletAddress,
	});
}

async function consumeChallenge(id: string) {
	const db = getDb();
	await db.update(authSignatureChallenges).set({ usedAt: dayjs().toDate() }).where(eq(authSignatureChallenges.id, id));
}

export async function verifyAndConsumeActivationChallenge(params: {
	userId: string;
	challengeId: string;
	walletAddress: string;
	signature: string;
}) {
	const db = getDb();
	const [challenge] = await db.select().from(authSignatureChallenges).where(eq(authSignatureChallenges.id, params.challengeId)).limit(1);
	if (!challenge) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Activation challenge not found' });
	}
	assertChallengeValid(challenge, { userId: params.userId, walletAddress: params.walletAddress });
	const message = buildChallengeMessage(challenge);
	const client = getThirdWebClient();
	console.log('[activation.verify]: start', { address: params.walletAddress });
	const isValid = await verifySignature({
		client,
		chain: polygon,
		message,
		signature: params.signature,
		address: params.walletAddress,
	});
	console.log('[activation.verify]: result', { address: params.walletAddress, isValid });
	if (!isValid) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Invalid wallet signature. Ownership verification failed.' });
	}
	await consumeChallenge(challenge.id);
}
