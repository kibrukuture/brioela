import { AppContext } from '@/index';
export const healthCheck = (c: AppContext) => {
	return c.json({
		status: 'ok',
		timestamp: Date.now(),
	});
};
