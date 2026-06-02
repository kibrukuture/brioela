import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { bankingCustomerAddresses } from '@schnl/shared/drizzle/schema';
import { eq } from '@schnl/shared/drizzle';
import { ErrorCode } from '@schnl/shared/types/api';
import { HTTPException } from 'hono/http-exception';
import { customerAddressResponseSchema } from '@schnl/shared/validators/customer-address.validator';

export async function getCustomerAddress(c: AppContext) {
	const user = c.get('user');
	if (!user?.id) {
		throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });
	}

	const db = getDb();
	const [row] = await db
		.select({
			streetLine1: bankingCustomerAddresses.streetLine1,
			city: bankingCustomerAddresses.city,
			state: bankingCustomerAddresses.state,
			postalCode: bankingCustomerAddresses.postalCode,
			country: bankingCustomerAddresses.country,
		})
		.from(bankingCustomerAddresses)
		.where(eq(bankingCustomerAddresses.userId, user.id))
		.limit(1);

	let address = null;
	if (row) {
		address = {
			streetLine1: row.streetLine1 ?? null,
			city: row.city ?? null,
			state: row.state ?? null,
			postalCode: row.postalCode ?? null,
			country: row.country ?? null,
		};
	}

	const validation = customerAddressResponseSchema.safeParse({ address });
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0].message });
	}

	return validation.data;
}
