# Draft: bela.routes.ts (gap — file does not exist)

Target: `shared/routes/bela.routes.ts`

**Source:** `build-guide/11-bela/`, `_features/42-bela/build.md`

---

```typescript
export const BELA_ROUTES = {
	orders: {
		create: '/api/v1/bela/orders',
		get: (orderId: string) => `/api/v1/bela/orders/${orderId}`,
		cancel: (orderId: string) => `/api/v1/bela/orders/${orderId}/cancel`,
		confirmDelivery: (orderId: string) => `/api/v1/bela/orders/${orderId}/confirm-delivery`,
		dispute: (orderId: string) => `/api/v1/bela/orders/${orderId}/dispute`,
	},
	shopper: {
		apply: '/api/v1/bela/shopper/apply',
		pendingOrders: '/api/v1/bela/shopper/orders/pending',
		accept: (orderId: string) => `/api/v1/bela/shopper/orders/${orderId}/accept`,
		decline: (orderId: string) => `/api/v1/bela/shopper/orders/${orderId}/decline`,
		startShopping: (orderId: string) => `/api/v1/bela/shopper/orders/${orderId}/start-shopping`,
		receiptScan: (orderId: string) => `/api/v1/bela/shopper/orders/${orderId}/receipt-scan`,
		registerBelaCard: '/api/v1/bela/shopper/bela-card',
		availability: '/api/v1/bela/shopper/availability',
		groundBatch: '/api/v1/bela/shopper/ground-batch',
	},
	standing: {
		create: '/api/v1/bela/standing-orders',
		cycles: (standingOrderId: string) => `/api/v1/bela/standing-orders/${standingOrderId}/cycles`,
	},
	family: {
		link: '/api/v1/bela/family-links',
		accept: (linkId: string) => `/api/v1/bela/family-links/${linkId}/accept`,
	},
	ws: {
		scanSession: (orderId: string) => `/bela/orders/${orderId}/scan-session`,
	},
} as const
```
