import { Hono } from 'hono';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';
import { onUpdateCommunicationCode, onGetCommunicationCode } from '@/api/communication-codes/communication-code.controller';

const communicationCodeRoutes = new Hono();

communicationCodeRoutes.post(API_ROUTE_PATTERNS.communicationCode.update, onUpdateCommunicationCode);
communicationCodeRoutes.get(API_ROUTE_PATTERNS.communicationCode.get, onGetCommunicationCode);

export default communicationCodeRoutes;
