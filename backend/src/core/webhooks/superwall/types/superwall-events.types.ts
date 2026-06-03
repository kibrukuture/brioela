// Superwall webhook event types based on official documentation
import { SubscriptionPlatform } from '@brioela/shared/drizzle/schema/user.schema';
export const SuperwallEventEnum = {
	initial_purchase: 'initial_purchase',
	renewal: 'renewal',
	cancellation: 'cancellation',
	uncancellation: 'uncancellation',
	expiration: 'expiration',
	billing_issue: 'billing_issue',
	product_change: 'product_change',
	subscription_paused: 'subscription_paused',
	non_renewing_purchase: 'non_renewing_purchase',
	test: 'test',
} as const;

export type SuperwallEventType = keyof typeof SuperwallEventEnum;

export type PeriodType = 'TRIAL' | 'INTRO' | 'NORMAL';

// export type Store = 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'PADDLE';
export type Store = (typeof SubscriptionPlatform.enumValues)[number];
export type Environment = 'PRODUCTION' | 'SANDBOX';

export type CancelReason = 'BILLING_ERROR' | 'CUSTOMER_SUPPORT' | 'UNSUBSCRIBE' | 'PRICE_INCREASE' | 'DEVELOPER_INITIATED' | 'UNKNOWN';

export type ExpirationReason = CancelReason;

export interface SuperwallEventData {
	id: string;
	name: SuperwallEventType;
	cancelReason: CancelReason | null;
	exchangeRate: number;
	isSmallBusiness: boolean;
	periodType: PeriodType;
	countryCode: string;
	price: number;
	proceeds: number;
	priceInPurchasedCurrency: number;
	taxPercentage: number;
	commissionPercentage: number;
	takehomePercentage: number;
	offerCode: string | null;
	isFamilyShare: boolean;
	expirationAt: number | null;
	transactionId: string;
	originalTransactionId: string;
	originalAppUserId: string | null;
	store: Store;
	purchasedAt: number;
	currencyCode: string;
	productId: string;
	environment: Environment;
	isTrialConversion: boolean;
	newProductId: string | null;
	bundleId: string;
	ts: number;
	expirationReason?: ExpirationReason;
	checkoutContext?: unknown;
}

export interface SuperwallWebhookPayload {
	object: 'event';
	type: SuperwallEventType;
	projectId: number;
	applicationId: number;
	timestamp: number;
	data: SuperwallEventData;
}

// Helper types for service responses
export interface ProcessedEvent {
	eventId: string;
	eventType: SuperwallEventType;
	userId: string | null;
	processed: boolean;
	error?: string;
}
