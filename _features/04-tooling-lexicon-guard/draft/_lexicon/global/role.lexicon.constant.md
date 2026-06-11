# Draft: _lexicon/global/role.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/global/role.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const globalRoleLexicon: LexiconWord[] = [
  { word: 'config', kind: 'role', scopes: ['global'], meaning: 'Validated configuration boundary.' },
  { word: 'event', kind: 'role', scopes: ['global'], meaning: 'Fact that happened in time.' },
  { word: 'events', kind: 'role', scopes: ['global'], meaning: 'Many facts that happened in time.' },
  { word: 'handler', kind: 'role', scopes: ['global'], meaning: 'Entry point that coordinates a runtime operation.' },
  { word: 'helper', kind: 'role', scopes: ['global'], meaning: 'Small pure support function with exact ownership.' },
  { word: 'index', kind: 'role', scopes: ['global'], meaning: 'Scoped barrel export file.' },
  { word: 'middleware', kind: 'role', scopes: ['global'], meaning: 'Request pipeline function mounted around routes.' },
  { word: 'repository', kind: 'role', scopes: ['global'], meaning: 'Persistence access boundary using approved database surfaces.' },
  { word: 'route', kind: 'role', scopes: ['global'], meaning: 'HTTP route definition surface.' },
  { word: 'routes', kind: 'role', scopes: ['global'], meaning: 'Grouped HTTP route definitions.' },
  { word: 'rpc', kind: 'role', scopes: ['global'], meaning: 'Typed callable boundary between agents or processes.' },
  { word: 'schema', kind: 'role', scopes: ['global'], meaning: 'Validated shape or Drizzle table definition boundary.' },
  { word: 'type', kind: 'role', scopes: ['global'], meaning: 'Compile-time shape definition.' },
]
```
