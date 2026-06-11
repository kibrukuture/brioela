# Draft: _helpers/create.content.hash.helper.ts

Target: `tools/brioela-reading-gate/_helpers/create.content.hash.helper.ts`

```typescript
export function createContentHash(fileBytes: ArrayBuffer): string {
  return Bun.SHA256.hash(fileBytes, 'hex')
}
```
