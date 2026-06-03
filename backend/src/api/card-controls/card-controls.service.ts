import { AppContext } from '@/index';
import { and, eq } from '@brioela/shared/drizzle';
import { cardControls } from '@brioela/shared/drizzle/schema/card-controls.schema';
import { getDb } from '@/core/database/client';
import { updateCardControlsSchema, cardControlKeys, type CardControlKey } from '@brioela/shared/validators/card-controls.validator';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

async function findExisting(db: ReturnType<typeof getDb>, userId: string, cardId: string) {
	const [existing] = await db
		.select()
		.from(cardControls)
		.where(and(eq(cardControls.userId, userId), eq(cardControls.cardId, cardId)))
		.limit(1);
	return existing;
}

export async function getCardControls(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const cardId = c.req.param('cardId');
	if (!cardId) throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'cardId is required' });

	const db = getDb();
	const existing = await findExisting(db, user.id, cardId);

	if (existing) {
		return existing;
	}

	const [created] = await db
		.insert(cardControls)
		.values({
			userId: user.id,
			cardId,
		})
		.returning();

	return created;
}

export async function updateCardControls(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const cardId = c.req.param('cardId');
	if (!cardId) throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'cardId is required' });

	const body = await c.req.json();
	const parsed = updateCardControlsSchema.safeParse(body);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0]?.message ?? 'Invalid input' });
	}

	// enforce URL and body cardId match
	if (parsed.data.cardId !== cardId) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'cardId mismatch' });
	}

	const db = getDb();

	const controlColumnMap = {
		onlinePayments: 'onlinePayments',
		magneticStripe: 'magneticStripe',
		contactless: 'contactless',
		chipTransactions: 'chipTransactions',
		mobileWallet: 'mobileWallet',
		cashWithdrawals: 'cashWithdrawals',
		non3dSecure: 'non3dSecure',
		overseasPayments: 'overseasPayments',
	} satisfies Record<CardControlKey, keyof typeof cardControls.$inferInsert>;

	const provided = cardControlKeys
		.map((key) => [key, parsed.data.controls[key]] as const)
		.filter(([, value]) => typeof value === 'boolean') as Array<[CardControlKey, boolean]>;

	const nextValues = provided.reduce((acc, [key, value]) => {
		const column = controlColumnMap[key];
		acc[column] = value;
		return acc;
	}, {} as Partial<typeof cardControls.$inferInsert>);

	const [updated] = await db
		.update(cardControls)
		.set({ ...nextValues })
		.where(and(eq(cardControls.userId, user.id), eq(cardControls.cardId, cardId)))
		.returning();

	if (updated) {
		return updated;
	}

	const [created] = await db
		.insert(cardControls)
		.values({
			userId: user.id,
			cardId,
			...nextValues,
		})
		.returning();

	return created;
}
