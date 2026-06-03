import { z } from '@brioela/shared/zod';

export const ConfidenceSchema = z
	.number()
	.min(0)
	.max(1)
	//
	.describe('Confidence score between 0 and 1, where 1 is highest confidence');
