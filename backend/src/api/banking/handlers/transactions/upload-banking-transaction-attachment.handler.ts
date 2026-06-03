import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { uploadFile } from '@/core/storage/services/s3.service';
import { bankingTransactions } from '@schnl/shared/drizzle/schema';
import { and, eq } from '@schnl/shared/drizzle';
import { PUBLIC_S3_URL } from '@schnl/shared/constants';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { uploadBankingTransactionAttachmentResponseSchema } from '@schnl/shared/validators/banking-transaction-attachment-api.validator';
import { bankingTransactionIdParamSchema } from '@schnl/shared/validators/banking-transaction-note-api.validator';

const ALLOWED_CONTENT_TYPES = new Set<string>(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10mb

export async function uploadBankingTransactionAttachment(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsedParams = bankingTransactionIdParamSchema.safeParse({
		id: c.req.param('id'),
	});
	if (!parsedParams.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsedParams.error.issues[0].message });
	}

	const transactionId = parsedParams.data.id;

	const contentTypeHeader = c.req.header('content-type') ?? c.req.header('Content-Type');
	if (!contentTypeHeader || !contentTypeHeader.toLowerCase().includes('multipart/form-data')) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Expected multipart/form-data' });
	}

	let form: FormData;
	try {
		form = await c.req.formData();
	} catch (error: unknown) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: error instanceof Error ? error.message : 'Failed to parse multipart form data',
		});
	}

	const filePart = form.get('file');
	if (!(filePart instanceof File)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: 'Missing multipart file field: file' });
	}

	if (!filePart.type || !ALLOWED_CONTENT_TYPES.has(filePart.type)) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: `Invalid file type. Allowed: ${Array.from(ALLOWED_CONTENT_TYPES).join(', ')}`,
		});
	}

	const arrayBuffer = await filePart.arrayBuffer();
	if (arrayBuffer.byteLength > MAX_ATTACHMENT_BYTES) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message: `Attachment too large. Max ${MAX_ATTACHMENT_BYTES} bytes`,
		});
	}

	const db = getDb();
	const [row] = await db
		.select({ id: bankingTransactions.id, attachments: bankingTransactions.attachments })
		.from(bankingTransactions)
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)))
		.limit(1);

	if (!row) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Transaction not found' });

	const fileKey = await uploadFile({
		file: filePart,
		userId: user.id,
		folder: 'transaction-attachments',
	});

	const attachmentId = nanoid(16);
	const publicUrl = `${PUBLIC_S3_URL}/${fileKey}`;

	const attachment = {
		id: attachmentId,
		name: filePart.name,
		mimeType: filePart.type,
		url: publicUrl,
		fileKey,
		createdAt: dayjs().toISOString(),
	};

	const nextAttachments = [...(row.attachments ?? []), attachment];

	await db
		.update(bankingTransactions)
		.set({ attachments: nextAttachments })
		.where(and(eq(bankingTransactions.id, transactionId), eq(bankingTransactions.userId, user.id)));

	const validation = uploadBankingTransactionAttachmentResponseSchema.safeParse({
		ok: true,
		attachment,
	});
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
