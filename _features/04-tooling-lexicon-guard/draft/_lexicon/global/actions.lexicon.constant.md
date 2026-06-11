# Draft: _lexicon/global/actions.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/global/actions.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const globalActionLexicon: LexiconWord[] = [
  { word: 'acquire', kind: 'action', scopes: ['global'], meaning: 'Claim ownership of a runtime resource or lock.' },
  { word: 'add', kind: 'action', scopes: ['global'], meaning: 'Put a new item into an existing collection.' },
  { word: 'append', kind: 'action', scopes: ['global'], meaning: 'Add an item to the end of an ordered log.' },
  { word: 'apply', kind: 'action', scopes: ['global'], meaning: 'Execute a prepared change.' },
  { word: 'ban', kind: 'action', scopes: ['global'], meaning: 'Reject a forbidden code pattern.' },
  { word: 'build', kind: 'action', scopes: ['global'], meaning: 'Construct a derived artifact.' },
  { word: 'check', kind: 'action', scopes: ['global'], meaning: 'Validate a condition without mutating product state.' },
  { word: 'collect', kind: 'action', scopes: ['global'], meaning: 'Gather many items from a source.' },
  { word: 'create', kind: 'action', scopes: ['global'], meaning: 'Produce a new owned value or resource.' },
  { word: 'delete', kind: 'action', scopes: ['global'], meaning: 'Remove an owned value or resource.' },
  { word: 'enforce', kind: 'action', scopes: ['global'], meaning: 'Block code that violates a guard rule.' },
  { word: 'export', kind: 'action', scopes: ['global'], meaning: 'Expose a module member.' },
  { word: 'filter', kind: 'action', scopes: ['global'], meaning: 'Select matching items from a collection.' },
  { word: 'find', kind: 'action', scopes: ['global'], meaning: 'Locate one or more matching things.' },
  { word: 'format', kind: 'action', scopes: ['global'], meaning: 'Turn structured state into display text.' },
  { word: 'import', kind: 'action', scopes: ['global'], meaning: 'Bring a module member into a file.' },
  { word: 'launch', kind: 'action', scopes: ['global'], meaning: 'Start an operating-system process.' },
  { word: 'list', kind: 'action', scopes: ['global'], meaning: 'Return many items.' },
  { word: 'load', kind: 'action', scopes: ['global'], meaning: 'Read and parse state from storage.' },
  { word: 'mount', kind: 'action', scopes: ['global'], meaning: 'Attach middleware or routes to an app or router.' },
  { word: 'parse', kind: 'action', scopes: ['global'], meaning: 'Convert unknown input into a validated shape.' },
  { word: 'print', kind: 'action', scopes: ['global'], meaning: 'Emit diagnostic text.' },
  { word: 'read', kind: 'action', scopes: ['global'], meaning: 'Load without mutating.' },
  { word: 'record', kind: 'action', scopes: ['global'], meaning: 'Persist a fact.' },
  { word: 'resolve', kind: 'action', scopes: ['global'], meaning: 'Turn an input into a canonical target.' },
  { word: 'run', kind: 'action', scopes: ['global'], meaning: 'Reserved: orchestration-level execution only — daemons, guard runs, loop dispatch. Not for domain behavior.' },
  { word: 'select', kind: 'action', scopes: ['global'], meaning: 'Choose matching items.' },
  { word: 'tail', kind: 'action', scopes: ['global'], meaning: 'Follow log output.' },
  { word: 'validate', kind: 'action', scopes: ['global'], meaning: 'Check a value against a rule.' },
  { word: 'visit', kind: 'action', scopes: ['global'], meaning: 'Walk a TypeScript AST node.' },
  { word: 'watch', kind: 'action', scopes: ['global'], meaning: 'Continuously observe and rerun checks.' },
  { word: 'write', kind: 'action', scopes: ['global'], meaning: 'Persist or emit state.' },
]
```
