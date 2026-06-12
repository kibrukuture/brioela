# Production snapshot: diagnosis.schema.ts (stub only)

Target: `backend/src/core/ai/schemas/medical/diagnosis.schema.ts`

**Status:** Shipped as empty stub — **not** medical condition profile system.

---

## Shipped file (entire contents)

```typescript
// # Diagnosis/condition
```

## Boundary

Document/medical-report extraction may eventually populate `diagnosis.schema.ts` for visual intake (**34**). **23** condition activation flows through voice/chat detection + explicit user confirmation — not diagnosis extraction from lab PDFs.

Do not wire document diagnosis extraction directly to `medical_condition_profiles` without confirmation step.
