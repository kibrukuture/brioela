import { cors as honoCors } from 'hono/cors';
import { ALLOWED_CORS_ORIGINS } from '@brioela/shared/api';

export const createCors = () => {
	return honoCors({
		origin: ALLOWED_CORS_ORIGINS,
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
		credentials: true,
		maxAge: 86400,
	});
};
