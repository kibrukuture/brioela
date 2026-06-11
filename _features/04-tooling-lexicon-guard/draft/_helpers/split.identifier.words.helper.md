# Draft: _helpers/split.identifier.words.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/split.identifier.words.helper.ts`

```typescript
export function splitIdentifierWords(identifier: string): string[] {
  return identifier
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replaceAll(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase())
}
```
