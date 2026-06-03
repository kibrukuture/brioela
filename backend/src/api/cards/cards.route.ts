import { Hono } from 'hono';
import * as controller from '@/api/cards/cards.controller';
import { API_ROUTE_PATTERNS } from '@brioela/shared/api';

export const cardsRouter = new Hono();

cardsRouter.get(API_ROUTE_PATTERNS.cards.list, controller.onListCards);
cardsRouter.post(API_ROUTE_PATTERNS.cards.createOrder, controller.onCreateCardOrder);
cardsRouter.get(API_ROUTE_PATTERNS.cards.orderById, controller.onGetCardOrder);
cardsRouter.post(API_ROUTE_PATTERNS.cards.freeze, controller.onFreezeCard);
cardsRouter.post(API_ROUTE_PATTERNS.cards.unfreeze, controller.onUnfreezeCard);
cardsRouter.post(API_ROUTE_PATTERNS.cards.cancel, controller.onCancelCard);
cardsRouter.patch(API_ROUTE_PATTERNS.cards.label, controller.onSetCardLabel);
cardsRouter.patch(API_ROUTE_PATTERNS.cards.spendingLimits, controller.onUpdateCardSpendingLimits);
cardsRouter.get(API_ROUTE_PATTERNS.cards.spendingLimits, controller.onGetCardSpendingLimits);
cardsRouter.get(API_ROUTE_PATTERNS.cards.appleWalletProvisioning, controller.onGetAppleWalletProvisioning);
cardsRouter.get(API_ROUTE_PATTERNS.cards.googlePayProvisioning, controller.onGetGooglePayProvisioning);
