import { Hono } from 'hono';
import * as controller from '@/api/maps/maps.controller';
import { API_ROUTE_PATTERNS } from '@schnl/shared/api';

export const mapsRouter = new Hono();

mapsRouter.get(API_ROUTE_PATTERNS.maps.locationSearch, controller.onLocationSearch);
