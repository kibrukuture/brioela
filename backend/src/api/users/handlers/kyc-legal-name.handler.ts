import { AppContext } from '@/index';
import getAlignClient from '@/core/clients/align';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { getDb } from '@/core/database/client';
import { kycLegalNameSchema } from '@schnl/shared/validators/user.validator';
import { generateMembershipNumber } from '@/lib/membership-number';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@schnl/shared/types/api';

export async function kycLegalName(c: AppContext) {
	const body = await c.req.json();
	const authUser = c.get('user');
	if (!authUser) throw new HTTPException(ErrorCode.UNAUTHORIZED, { message: 'Unauthorized' });

	const db = getDb();
	const [user] = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
	if (!user) throw new HTTPException(ErrorCode.NOT_FOUND, { message: 'User not found' });

	const validation = kycLegalNameSchema.safeParse(body);
	if (!validation.success) {
		throw new HTTPException(ErrorCode.INVALID_INPUT, { message: validation.error.issues[0].message });
	}

	if (user.firstName && user.lastName) {
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Legal name is already set. Contact support to change.' });
	}

	let membershipNumber: string | undefined;
	let attempts = 0;
	while (attempts < 5) {
		const candidate = generateMembershipNumber('individual');
		const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.membershipNumber, candidate)).limit(1);
		if (!existing) {
			membershipNumber = candidate;
			break;
		}
		attempts++;
	}
	if (!membershipNumber) {
		throw new HTTPException(ErrorCode.INTERNAL_ERROR, { message: 'Failed to generate membership number. Please try again.' });
	}

	const align = getAlignClient();
	const customer = await align.customers.create({
		email: user.email,
		first_name: validation.data.firstName,
		last_name: validation.data.lastName,
		type: 'individual',
	});

	const [updatedUser] = await db
		.update(users)
		.set({
			firstName: validation.data.firstName,
			lastName: validation.data.lastName,
			membershipNumber: membershipNumber,
			bankingCustomerId: customer.customer_id,
		})
		.where(eq(users.id, user.id))
		.returning();

	return updatedUser;
}
