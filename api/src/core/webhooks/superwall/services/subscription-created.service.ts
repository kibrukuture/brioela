import { SuperwallEventData } from '@/core/webhooks/superwall/types/superwall-events.types';
import drizzle, { eq } from '@schnl/shared/drizzle';
import { users } from '@schnl/shared/drizzle/schema/user.schema';
import { SubscriptionPlatform } from '@schnl/shared/drizzle/schema/user.schema';

type Store = (typeof SubscriptionPlatform.enumValues)[number];
const StoreEnum = Object.fromEntries(SubscriptionPlatform.enumValues.map((value) => [value, value])) as Record<Store, Store>;

// export async function handleSubscriptionCreated(event: SuperwallEventData, db: ReturnType<typeof drizzle>, bindings: any) {
// 	console.log('\n┌─────────────────────────────────────────────────────┐');
// 	console.log('│  🎯 HANDLE SUBSCRIPTION CREATED                      │');
// 	console.log('└─────────────────────────────────────────────────────┘');

// 	const {
// 		originalAppUserId,
// 		originalTransactionId,
// 		productId,
// 		price,
// 		currencyCode,
// 		expirationAt,
// 		store,
// 		environment,
// 		periodType,
// 		purchasedAt,
// 	} = event;

// 	// Step 1: Environment check
// 	console.log('\n📋 STEP 1: Environment Check');
// 	console.log('Event Environment:', environment);
// 	console.log('Runtime Environment:', bindings.ENVIRONMENT);
// 	console.log('ACTAUL ARRIVING EVENT:', JSON.stringify(event));

// 	const isSandboxEvent = environment === 'SANDBOX';
// 	const isProductionRuntime = bindings.ENVIRONMENT === 'production';

// 	if (isSandboxEvent && isProductionRuntime) {
// 		console.log('Skipping sandbox event in production');
// 		return { processed: false, reason: 'sandbox_event' };
// 	}

// 	// Step 2: User identification
// 	console.log('\n🔍 STEP 2: User Identification');
// 	console.log('originalAppUserId:', originalAppUserId);
// 	console.log('originalTransactionId:', originalTransactionId);

// 	// Find user by originalAppUserId (Supabase user ID)
// 	if (!originalAppUserId) {
// 		console.error('No originalAppUserId in event');
// 		return { processed: false, reason: 'no_user_id' };
// 	}

// 	try {
// 		// Step 3: Database lookup
// 		console.log('\n🔎 STEP 3: Database User Lookup');
// 		console.log('Querying for user with:');
// 		console.log('  - superwallOriginalAppUserId:', originalAppUserId);
// 		console.log('  - superwallOriginalTransactionId:', originalTransactionId);
// 		console.log('  - id (if UUID):', originalAppUserId);

// 		const platform = StoreEnum[store];

// 		// Update user with subscription info
// 		await db
// 			.update(users)
// 			.set({
// 				paymentStatus: periodType === 'TRIAL' ? 'trialing' : 'active',
// 				subscriptionPlatform: platform,
// 				subscriptionProductId: productId,
// 				subscriptionProductPrice: Math.round(price * 100), // Convert to cents
// 				subscriptionProductCurrency: currencyCode,
// 				subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
// 				lastPaid: new Date(purchasedAt),
// 				superwallOriginalTransactionId: originalTransactionId, //todo: this originalTransactionId is always present and never absense. so you can use this as a safe uniqued id.
// 				superwallOriginalAppUserId: originalAppUserId,
// 				isInTrial: periodType === 'TRIAL',
// 				trialEndDate: periodType === 'TRIAL' && expirationAt ? new Date(expirationAt) : null,
// 				subscriptionPeriodType: periodType,
// 				subscriptionEnvironment: environment,
// 				paymentMetadata: JSON.stringify(event),
// 				updatedAt: new Date(),
// 			})
// 			.where(eq(users.id, originalAppUserId));

// 		console.log(`✅ Subscription created for user: ${originalAppUserId}`);

// 		return { processed: true, userId: originalAppUserId };
// 	} catch (error) {
// 		console.error('Error handling subscription created:', error);
// 		throw error;
// 	}
// }

export async function handleSubscriptionCreated(event: SuperwallEventData, db: ReturnType<typeof drizzle>) {
	console.log('\n┌─────────────────────────────────────────────────────┐');
	console.log('│  🎯 HANDLE SUBSCRIPTION CREATED                      │');
	console.log('└─────────────────────────────────────────────────────┘');

	const {
		originalAppUserId,
		originalTransactionId,
		productId,
		price,
		currencyCode,
		expirationAt,
		store,
		environment,
		periodType,
		purchasedAt,
	} = event;

	// Step 1: Environment check
	console.log('\n📋 STEP 1: Environment Check');
	console.log('Event Environment:', environment);
	console.log('Runtime Environment:', process.env.ENVIRONMENT);
	console.log('ACTUAL ARRIVING EVENT:', JSON.stringify(event, null, 2));

	const isSandboxEvent = environment === 'SANDBOX';
	const isProductionRuntime = process.env.ENVIRONMENT === 'production';

	if (isSandboxEvent && isProductionRuntime) {
		console.log('⏭️  Skipping sandbox event in production');
		return { processed: false, reason: 'sandbox_event' };
	}
	console.log('✅ Environment check passed');

	// Step 2: User identification
	console.log('\n🔍 STEP 2: User Identification');
	console.log('originalAppUserId:', originalAppUserId);
	console.log('originalTransactionId:', originalTransactionId);

	if (!originalAppUserId) {
		console.error('❌ No originalAppUserId in event');
		return { processed: false, reason: 'no_user_id' };
	}
	console.log('✅ User ID present');

	try {
		// Step 3: Database lookup
		console.log('\n🔎 STEP 3: Database User Lookup');
		console.log('Querying for user with ID:', originalAppUserId);

		const [existingUser] = await db.select().from(users).where(eq(users.id, originalAppUserId)).limit(1);

		if (!existingUser) {
			console.error('❌ User not found in database');
			console.error('Searched for user ID:', originalAppUserId);
			return { processed: false, reason: 'user_not_found', userId: originalAppUserId };
		}

		console.log('✅ User found in database');
		console.log('Database User ID:', existingUser.id);
		console.log('Database User Email:', existingUser.email);

		// Step 4: Update subscription
		console.log('\n💾 STEP 4: Update Subscription');
		console.log('Updating user:', existingUser.id);
		console.log('Payment Status:', periodType === 'TRIAL' ? 'trialing' : 'active');
		console.log('Product ID:', productId);
		console.log('Price:', price);

		const platform = StoreEnum[store];

		await db
			.update(users)
			.set({
				paymentStatus: periodType === 'TRIAL' ? 'trialing' : 'active',
				subscriptionPlatform: platform,
				subscriptionProductId: productId,
				subscriptionProductPrice: Math.round(price * 100), // Convert to cents
				subscriptionProductCurrency: currencyCode,
				subscriptionEndDate: expirationAt ? new Date(expirationAt) : null,
				lastPaid: new Date(purchasedAt),
				superwallOriginalTransactionId: originalTransactionId,
				superwallOriginalAppUserId: originalAppUserId,
				isInTrial: periodType === 'TRIAL',
				trialEndDate: periodType === 'TRIAL' && expirationAt ? new Date(expirationAt) : null,
				subscriptionPeriodType: periodType,
				subscriptionEnvironment: environment,
				paymentMetadata: JSON.stringify(event),
				updatedAt: new Date(),
			})
			.where(eq(users.id, existingUser.id));

		console.log('✅ Database updated successfully');
		console.log('\n┌─────────────────────────────────────────────────────┐');
		console.log('│  ✅ SUBSCRIPTION CREATED SUCCESSFULLY                │');
		console.log('└─────────────────────────────────────────────────────┘\n');

		return { processed: true, userId: existingUser.id };
	} catch (error) {
		console.log('\n┌─────────────────────────────────────────────────────┐');
		console.error('│  ❌ DATABASE ERROR                                   │');
		console.log('└─────────────────────────────────────────────────────┘');
		console.error('Error:', error);
		console.error('Error Message:', error instanceof Error ? error.message : 'Unknown');
		console.log('');
		throw error;
	}
}
