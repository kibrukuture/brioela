import getAlignClient from '@/core/clients/align';
import { API_ROUTES } from '@schnl/shared/api';
import { PUBLIC_URLS } from '@schnl/shared/constants';
import { AppContext } from '@/index';

export default async function onAlignWebhooks(c: AppContext) {
	console.log('onAlignWebhooks', process.env.ALIGNLAB_SANDBOX_API_KEY);
	const client = getAlignClient();

	const url = PUBLIC_URLS.PUBLIC_API_BASE_URL + API_ROUTES.webhooks['align.webhook'];
	// await client.webhooks.create({
	// 	url,
	// });
	return await client.webhooks.list();
}
