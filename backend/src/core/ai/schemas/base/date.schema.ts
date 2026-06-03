import { z } from '@brioela/shared/zod';

export const DateSchema = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.describe('ISO 8601 date format YYYY-MM-DD');

export const DateTimeSchema = z.iso.datetime().describe('ISO 8601 datetime format with timezone');
