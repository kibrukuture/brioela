# Draft: _helpers/explicitly.detached.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/explicitly.detached.helper.ts`

```typescript
export function explicitlyDetached(promise: Promise<unknown>, reason: string): void {
  promise.catch((error: unknown) => {
    console.error(`Detached Lexicon Guard task failed: ${reason}`)
    console.error(error)
  })
}
```
