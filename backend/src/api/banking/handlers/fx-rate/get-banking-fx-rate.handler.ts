import { AppContext } from '@/index';
import { ErrorCode } from '@brioela/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { getBankingFxRateQuerySchema } from '@brioela/shared/validators/banking-fx-rate.validator';

export async function getBankingFxRate(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const parsed = getBankingFxRateQuerySchema.safeParse({
		from: c.req.query('from'),
		to: c.req.query('to'),
	});
	if (!parsed.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: parsed.error.issues[0].message });
	}

	throw new HTTPException(ErrorCode.NOT_IMPLEMENTED, {
		message: 'FX rate provider not configured yet',
	});
}
