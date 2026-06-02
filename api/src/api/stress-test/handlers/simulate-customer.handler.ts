import { AppContext } from '@/index';
import { apiSuccessResponse, apiErrorResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';
import getAlignClient from '@/core/clients/align';

const customerId = 'fea6053e-fbb7-44c5-8649-2141ae9c0051';

export default async function simulateCustomer(c: AppContext) {
	try {
		const align = getAlignClient();
		const result = await align.customers.simulateCustomer({
			customer_id: customerId,
			action: 'kyc.status.approve',
		});
		return c.json(apiSuccessResponse(result));
	} catch (error) {
		return c.json(
			apiErrorResponse(ErrorCode.PROCESSING_FAILED, 'Simulation failed', error instanceof Error ? error.message : 'Unknown error'),
			500
		);
	}
}
