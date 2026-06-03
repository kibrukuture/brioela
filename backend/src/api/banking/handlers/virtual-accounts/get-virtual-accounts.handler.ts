import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingVirtualAccounts } from '@brioela/shared/drizzle/schema';
import { eq, desc } from '@brioela/shared/drizzle';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function getVirtualAccounts(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();
	return db
		.select()
		.from(bankingVirtualAccounts)
		.where(eq(bankingVirtualAccounts.userId, user.id))
		.orderBy(desc(bankingVirtualAccounts.createdAt));
}
