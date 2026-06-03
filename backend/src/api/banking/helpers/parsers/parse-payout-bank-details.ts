import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';
import { z } from '@brioela/shared/zod';
import { payRequestBankDetailsSchema } from '@brioela/shared/validators/pay-request.validator';

export function parsePayoutBankDetails(value: unknown) {
	const bankDetailsContainerSchema = z
		.object({
			bankDetails: payRequestBankDetailsSchema,
		})
		.loose();

	const containerParsed = bankDetailsContainerSchema.safeParse(value);
	if (containerParsed.success) return containerParsed.data.bankDetails;

	const parsedDetails = payRequestBankDetailsSchema.safeParse(value);
	if (!parsedDetails.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, {
			message:
				parsedDetails.error.issues[0]?.message ?? 'Invalid stored payout details (expected bankDetails wrapper or bankDetails object)',
		});
	}

	return parsedDetails.data;
}
