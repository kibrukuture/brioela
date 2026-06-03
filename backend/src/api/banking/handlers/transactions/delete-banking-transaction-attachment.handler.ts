import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { deleteFile } from '@/core/storage/services/s3.service';
import { bankingTransactions } from '@brioela/shared/drizzle/schema';
import { and, eq } from '@brioela/shared/drizzle';
import { deleteBankingTransactionAttachmentResponseSchema } from '@brioela/shared/validators/banking-transaction-attachment-api.validator';
import { bankingTransactionAttachmentParamsSchema } from '@brioela/shared/validators/banking-transaction-attachment-api.validator';

export async function deleteBankingTransactionAttachment(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsedParams = bankingTransactionAttachmentParamsSchema.safeParse({
		id: c.req.param('id'),
		attachmentId: c.req.param('attachmentId'),
	});
	if (!parsedParams.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsedParams.error.issues[0].message });
	}

	const { id: transactionId, attachmentId } = parsedParams.data;

	const db = getDb();
	const [row] = await db
		.select({ id: bankingTransactions.id, attachments: bankingTransactions.attachments })
		.from(bankingTransactions)
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)))
		.limit(1);

	if (!row) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Transaction not found' });

	const existing = row.attachments ?? [];
	const target = existing.find((a) => a.id === attachmentId);
	if (!target) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Attachment not found' });

	try {
		await deleteFile({ filePath: target.fileKey });
	} catch {}

	const nextAttachments = existing.filter((a) => a.id !== attachmentId);

	await db
		.update(bankingTransactions)
		.set({ attachments: nextAttachments })
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)));

	const validation = deleteBankingTransactionAttachmentResponseSchema.safeParse({ ok: true });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
