import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { z } from '@brioela/shared/zod';
import { TRANSFER_PURPOSES } from '@brioela/shared/constants/transfer-purposes';

export function parseTransferPurpose(value: unknown) {
	const parsed = z.enum(TRANSFER_PURPOSES).safeParse(value);
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, {
			message: parsed.error.issues[0]?.message ?? 'Invalid transfer purpose',
		});
	}
	return parsed.data;
}
