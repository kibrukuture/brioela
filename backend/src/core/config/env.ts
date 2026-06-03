import { z } from '@brioela/shared/zod';
import { HTTPException } from 'hono/http-exception';
import { ErrorCode } from '@brioela/shared/types/api';

const envSchema = z.object({
	// Database
	SUPABASE_URL: z.url(),
	SUPABASE_SERVICE_ROLE_KEY: z.string(),
	SUPABASE_DATABASE_URL: z.url(),
	SUPABASE_DATABASE_PASSWORD: z.string(),
	DATABASE_CONNECTION_STRING: z.string(),

	// AI
	GEMINI_API_KEY: z.string(),
	OPENAI_API_KEY: z.string(),

	// Email
	ZEPTOMAIL_PASSWORD: z.string(),
	ZEPTOMAIL_SERVER_NAME: z.string(),
	ZEPTOMAIL_USER_NAME: z.string(),
	ZEPTOMAIL_URL: z.url(),
	ZEPTOMAIL_TOKEN: z.string(),

	// Upstash
	QSTASH_URL: z.url(),
	QSTASH_TOKEN: z.string(),
	QSTASH_CURRENT_SIGNING_KEY: z.string(),
	QSTASH_NEXT_SIGNING_KEY: z.string(),

	// Stripe
	STRIPE_MONTHLY_PRICE_ID: z.string(),
	STRIPE_YEARLY_PRICE_ID: z.string(),
	STRIPE_PUBLISHABLE_KEY: z.string(),
	STRIPE_SECRET_KEY: z.string(),
	STRIPE_SECRET_WEBHOOK_KEY: z.string(),

	// Superwall
	SUPERWALL_WEBHOOK_SECRET: z.string(),
	SUPERWALL_HEADER_AUTH_TOKEN: z.string(),

	// Sentry
	SENTRY_DSN_BACKEND: z.url(),

	// R2 Storage (S3-compatible)
	R2_ACCOUNT_ID: z.string(),
	R2_ACCESS_KEY_ID: z.string(),
	R2_SECRET_ACCESS_KEY: z.string(),
	R2_BUCKET_NAME: z.string(),

	// Environment
	ENVIRONMENT: z.enum(['production', 'development']),
	ALIGNLAB_API_KEY: z.string(),
	SUPABASE_CA_CERT: z.string(),

	ALIGNLAB_SANDBOX_API_KEY: z.string(),

	POLYGON_ALCHEMY_URL: z.url(),

	// WALLET INFRA. (NON CUSTODIAL)
	THIRD_WEB_CLIENT_ID: z.string(),
	THIRD_WEB_API_SECRET: z.string(),
	THIRD_WEB_SERVER_WALLET_ADDRESS: z.string(),
	THIRD_WEB_SERVER_SMART_ACCOUNT_ADDRESS: z.string(),
	THIRD_WEB_SERVER_WALLET_LABEL: z.string(),

	//
	RESEND_API_KEY: z.string(),

	COURIER_AUTH_KEY: z.string(),

	ONESIGNAL_APP_ID: z.string(),
	ONESIGNAL_REST_API_KEY: z.string(),

	// Encryption
	ENCRYPTION_KEY: z.string(),
	S3_URL: z.url(),

	//
	REDIS_URL: z.url(),
	REDIS_TOKEN: z.string(),
	REDIS_API_KEY: z.string(),

	//

	LOCATION_IQ_ACCESS_TOKEN: z.string(),
});

export type Env = z.infer<typeof envSchema>;

const parseEnv = (): Env => {
	const result = envSchema.safeParse(process.env);

	if (!result.success) {
		console.error('❌ Invalid environment variables:');
		console.error(result.error.format());
		throw new HTTPException(ErrorCode.PRECONDITION_FAILED, { message: 'Invalid environment variables' });
	}

	return result.data;
};

export const env = parseEnv();

declare global {
	namespace NodeJS {
		interface ProcessEnv extends Env {}
	}
}
