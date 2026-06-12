# Draft: receipt.routes.ts (gap — file does not exist)

Target: `shared/routes/receipt.routes.ts`

---

```typescript
export const RECEIPT_ROUTES = {
  ingest: '/receipts/ingest',
  byId: (id: string) => `/receipts/${id}`,
  priceHistory: (receiptId: string, productId: string) =>
    `/receipts/${receiptId}/price-history/${productId}`,
} as const

export const SPEND_ROUTES = {
  summary: '/spend/summary',
} as const

export const RECEIPT_ROUTE_PATTERNS = {
  ingest: '/receipts/ingest',
  byId: '/receipts/:id',
  priceHistory: '/receipts/:receiptId/price-history/:productId',
  spendSummary: '/spend/summary',
} as const
```

Mount: `backend/src/api/receipt/receipt.route.ts` at `/api` prefix per **01** router convention.
