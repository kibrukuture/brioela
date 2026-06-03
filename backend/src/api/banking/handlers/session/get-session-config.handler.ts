import { AppContext } from '@/index';
import dayjs from 'dayjs';
import { sessionConfigResponseSchema } from '@brioela/shared/validators/banking.validator';
import { USDC_BY_CHAIN, CHAIN_IDS } from '@brioela/shared/constants';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function getSessionConfig(c: AppContext) {
	const user = c.get('user');
	if (!user) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	const sessionKeyAddress = process.env.THIRD_WEB_SERVER_WALLET_ADDRESS;
	const chainId = CHAIN_IDS.POLYGON_POS;
	if (!sessionKeyAddress) throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Server wallet address not configured' });
	const start = dayjs();
	const end = start.add(365, 'day');
	const usdcAddress = USDC_BY_CHAIN[CHAIN_IDS.POLYGON_POS];
	const payload = {
		sessionKeyAddress,
		chainId,
		approvedTargets: [usdcAddress],
		nativeTokenLimitPerTransaction: '0',
		permissionStartTimestamp: start.toDate(),
		permissionEndTimestamp: end.toDate(),
	};
	console.log('[session.config]: payload', {
		sessionKeyAddress,
		chainId,
		approvedTargets: [usdcAddress],
		nativeTokenLimitPerTransaction: '0',
	});
	return sessionConfigResponseSchema.parse(payload);
}
