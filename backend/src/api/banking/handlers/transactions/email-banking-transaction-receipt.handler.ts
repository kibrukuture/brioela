import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingTransactions } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import dayjs from 'dayjs';
import getResendClient from '@/core/clients/resend';
import { EMAIL_FROM } from '@schnl/shared/constants';
import { generateTransactionReceiptPDF } from '@/api/banking/handlers/transactions/templates/transaction-receipt-document';
import { emailBankingTransactionReceiptResponseSchema } from '@schnl/shared/validators/banking-transaction-attachment-api.validator';
import { bankingTransactionIdParamSchema } from '@schnl/shared/validators/banking-transaction-note-api.validator';

export async function emailBankingTransactionReceipt(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsedParams = bankingTransactionIdParamSchema.safeParse({
		id: c.req.param('id'),
	});
	if (!parsedParams.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsedParams.error.issues[0].message });
	}

	const transactionId = parsedParams.data.id;

	const db = getDb();
	const [row] = await db
		.select({
			id: bankingTransactions.id,
			userId: bankingTransactions.userId,
			displayTitle: bankingTransactions.displayTitle,
			description: bankingTransactions.description,
			createdAt: bankingTransactions.createdAt,
			amountAtomic: bankingTransactions.amountAtomic,
			currency: bankingTransactions.currency,
			category: bankingTransactions.category,
			note: bankingTransactions.note,
		})
		.from(bankingTransactions)
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)))
		.limit(1);

	if (!row) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Transaction not found' });
	if (!user.email) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'User email not found' });

	const pdfBytes = await generateTransactionReceiptPDF({
		transaction: {
			id: row.id,
			displayTitle: row.displayTitle,
			description: row.description,
			createdAt: row.createdAt,
			amountAtomic: row.amountAtomic,
			currency: row.currency,
			category: row.category,
			note: row.note,
		},
		user: { email: user.email },
	});

	const fileName = `transaction-receipt-${dayjs(row.createdAt).format('YYYY-MM-DD')}.pdf`;
	const resendClient = getResendClient();
	const emailResult = await resendClient.emails.send({
		to: user.email,
		subject: 'Your Schnl transaction receipt',
		from: EMAIL_FROM.generic,
		html: '<p>Your receipt is attached.</p>',
		attachments: [
			{
				filename: fileName,
				content: Buffer.from(pdfBytes).toString('base64'),
			},
		],
	});

	if (emailResult.error) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to send receipt email' });
	}

	const validation = emailBankingTransactionReceiptResponseSchema.safeParse({ ok: true });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
