import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingExternalAccounts } from '@schnl/shared/drizzle/schema';
import { desc, eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { listBankingRecipientsResponseSchema } from '@schnl/shared/validators/banking-recipient.validator';
import dayjs from 'dayjs';

export async function listBankingRecipients(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();
	const recipients = await db
		.select()
		.from(bankingExternalAccounts)
		.where(eq(bankingExternalAccounts.userId, user.id))
		.orderBy(desc(bankingExternalAccounts.createdAt));

	const recipientsUi = recipients.map((r) => ({
		...r,
		createdAt: dayjs(r.createdAt).toISOString(),
	}));

	const validation = listBankingRecipientsResponseSchema.safeParse({
		recipients: recipientsUi,
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
