import { AppContext } from '@/index';
import { getDb } from '@/core/database/client';
import { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema';
import { apiErrorResponse, apiSuccessResponse } from '@/lib/response';
import { ErrorCode } from '@schnl/shared/types/api';

export async function testDatabase(c: AppContext) {
	try {
		const db = getDb();

		// Generate a unique test email
		const testEmail = `test-${Date.now()}@example.com`;

		// Insert a test user
		const [newUser] = await db
			.insert(users)
			.values({
				email: testEmail,
			})
			.returning({
				email: users.email,
				id: users.id,
			});

		// Clean up - delete the test user
		await db.delete(users).where(eq(users.id, newUser.id));
		console.log({
			newUser,
		});
		return c.json(
			apiSuccessResponse({
				success: true,
				message: 'Database connection works!',
				test: {
					created: newUser,
				},
			})
		);
	} catch (error) {
		return c.json(
			apiErrorResponse(ErrorCode.INTERNAL_ERROR, 'Database connection failed', error instanceof Error ? error.message : 'Unknown error'),
			500
		);
	}
}
