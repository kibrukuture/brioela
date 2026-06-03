import { CRON_TIMES } from '@brioela/shared/constants';
import { ScheduledController } from '@cloudflare/workers-types';
import { pingUpstash } from '@/temp/upstash-pinger';
import { pingSupabase } from '@/temp/supabase-pinger';
import { backendErrorReporter } from '@/lib/sentry.config';
import { toError } from '@/lib/error-utils';

export async function cronJobsHandler(controller: ScheduledController, _env: unknown, _ctx: ExecutionContext): Promise<void> {
	const cronTime = controller.cron;

	try {
		switch (cronTime) {
			case CRON_TIMES.every_day_at_2_am:
				await pingUpstash();
				console.log('Upstash ping message published');
				await pingSupabase();
				console.log('Supabase ping message published');
				break;
			default:
				console.log('No cron job found');
				break;
		}
	} catch (error) {
		console.error('Error pinging Upstash:', error);
		backendErrorReporter.captureError(
			toError(error),
			{
				tags: { cronJob: cronTime },
				metadata: { cronTime },
			},
			'error'
		);
	}
}
