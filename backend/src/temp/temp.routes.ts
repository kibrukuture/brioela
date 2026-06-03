import { Hono } from 'hono';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';
import { pingUpstash } from '@/temp/services/upstash.service';
const tempRoutes = new Hono();

tempRoutes.post(API_ROUTE_PATTERNS.queue['temp.upstash'], pingUpstash);

export default tempRoutes;
