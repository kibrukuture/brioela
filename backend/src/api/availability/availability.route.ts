import { Hono } from 'hono';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';
import { onCheckSchnlTag } from '@/api/availability/availability.controller';
const availabilityRouter = new Hono();

availabilityRouter.get(API_ROUTE_PATTERNS.availability.checkSchnlTag, onCheckSchnlTag);

export default availabilityRouter;
