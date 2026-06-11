# Draft: _lexicon/global/platform.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/global/platform.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const globalPlatformLexicon: LexiconWord[] = [
  { word: 'property', kind: 'domain', scopes: ['global'], meaning: 'Named object field inspected by a type guard.' },
  { word: 'api', kind: 'platform', scopes: ['global'], meaning: 'Application programming interface boundary.' },
  { word: 'argument', kind: 'platform', scopes: ['global'], meaning: 'Function call argument in source code.' },
  { word: 'async', kind: 'platform', scopes: ['global'], meaning: 'Asynchronous runtime behavior.' },
  { word: 'call', kind: 'platform', scopes: ['global'], meaning: 'Function or method invocation in source code.' },
  { word: 'construction', kind: 'platform', scopes: ['global'], meaning: 'Native object creation expression.' },
  { word: 'date', kind: 'platform', scopes: ['global'], meaning: 'Native JavaScript Date API that product code must avoid.' },
  { word: 'dayjs', kind: 'platform', scopes: ['global'], meaning: 'Approved Brioela date and time library.' },
  { word: 'declaration', kind: 'domain', scopes: ['global'], meaning: 'Named TypeScript construct.' },
  { word: 'drizzle', kind: 'platform', scopes: ['global'], meaning: 'The only approved database language in product runtime code.' },
  { word: 'epoch', kind: 'platform', scopes: ['global'], meaning: 'Unix epoch timestamp representation.' },
  { word: 'expression', kind: 'platform', scopes: ['global'], meaning: 'TypeScript AST expression node.' },
  { word: 'identifier', kind: 'domain', scopes: ['global'], meaning: 'Named code symbol.' },
  { word: 'idx', kind: 'platform', scopes: ['global'], meaning: 'Drizzle migration journal index field.' },
  { word: 'imports', kind: 'domain', scopes: ['global'], meaning: 'Generated import declarations.' },
  { word: 'json', kind: 'platform', scopes: ['global'], meaning: 'JSON serialization format.' },
  { word: 'method', kind: 'platform', scopes: ['global'], meaning: 'Object method call in source code.' },
  { word: 'module', kind: 'domain', scopes: ['global'], meaning: 'Importable code unit.' },
  { word: 'ms', kind: 'platform', scopes: ['global'], meaning: 'Millisecond timestamp unit.' },
  { word: 'native', kind: 'platform', scopes: ['global'], meaning: 'Built-in runtime API that may need explicit approval.' },
  { word: 'new', kind: 'platform', scopes: ['global'], meaning: 'TypeScript or Drizzle insert-side value shape.' },
  { word: 'node', kind: 'platform', scopes: ['global'], meaning: 'TypeScript AST node or Node.js runtime concept.' },
  { word: 'platform', kind: 'domain', scopes: ['global'], meaning: 'Controlled lexicon category for runtime or external tools.' },
  { word: 'script', kind: 'platform', scopes: ['global'], meaning: 'Executable source file or TypeScript script kind.' },
  { word: 'string', kind: 'platform', scopes: ['global'], meaning: 'Primitive text value.' },
  { word: 'typescript', kind: 'platform', scopes: ['global'], meaning: 'TypeScript language/runtime tooling.' },
  { word: 'v1', kind: 'platform', scopes: ['global'], meaning: 'Version one API route namespace.' },
  { word: 'variables', kind: 'platform', scopes: ['global'], meaning: 'Hono typed context variable container key.' },
]
```
