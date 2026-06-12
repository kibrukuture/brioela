# Production snapshot: log_memory_event (05 — scan dual-write target)

Target: `backend/src/agents/brain/_tools/log.memory.event.tool.ts`

**Status:** Shipped tool (**05-brain-memory-tools**). Scanner must call via Brain internal route or reuse tool executable on resolve.

---

## Dual-write contract (24 + 05 G6)

After successful resolve:

```typescript
await brain.fetch(new Request('https://internal/log-scan', {
  method: 'POST',
  body: JSON.stringify({
    scanEventId,
    productId: product.id,
    productName: product.name,
    verdict: verdict.level,
    geoHash: input.geoHash,
    capturedAt: input.capturedAt,
  }),
}))
```

Brain handler maps to:

```typescript
{
  kind: 'product_scanned',
  entityKind: 'product',
  entityId: productId,
  payloadJson: JSON.stringify({ scanEventId, verdict, geoHash, capturedAt }),
}
```

**Supabase `scan_events`** = cross-user recall (**31**). **Brain `memory_event`** = per-user illness detective (**32**).
