import { AppContext } from '@/index';
import { getThirdWebClient } from '@/core/clients/third-web';
import { embeddedWalletResponseSchema } from '@brioela/shared/validators/banking.validator';
import { getUser } from 'thirdweb/wallets';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

export async function getEmbeddedWallet(c: AppContext) {
	const user = c.get('user');
	if (!user?.email) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized: Email required' });

	const client = getThirdWebClient();
	const result = await getUser({ client, email: user.email });
	if (!result) {
		throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'Embedded wallet not found' });
	}

	return embeddedWalletResponseSchema.parse({
		address: result.walletAddress,
	});
}
