# Draft: _lexicon/global/filesystem.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/global/filesystem.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const globalFilesystemLexicon: LexiconWord[] = [
  { word: 'filesystem', kind: 'domain', scopes: ['global'], meaning: 'Operating-system file and folder namespace.' },
  { word: 'absolute', kind: 'domain', scopes: ['global'], meaning: 'Canonical non-relative location.' },
  { word: 'file', kind: 'domain', scopes: ['global'], meaning: 'Repository or filesystem file.' },
  { word: 'files', kind: 'domain', scopes: ['global'], meaning: 'Many repository or filesystem files.' },
  { word: 'folder', kind: 'domain', scopes: ['global'], meaning: 'Repository or filesystem directory.' },
  { word: 'parent', kind: 'domain', scopes: ['global'], meaning: 'Containing scope or folder.' },
  { word: 'path', kind: 'domain', scopes: ['global'], meaning: 'Repository, URL, or filesystem location.' },
  { word: 'prefix', kind: 'domain', scopes: ['global'], meaning: 'Leading text segment used for matching.' },
  { word: 'repo', kind: 'domain', scopes: ['global'], meaning: 'Repository-relative identity.' },
  { word: 'root', kind: 'domain', scopes: ['global'], meaning: 'Top of a workspace or scoped tree.' },
  { word: 'suffix', kind: 'domain', scopes: ['global'], meaning: 'Trailing name segment that identifies a role or pattern.' },
  { word: 'workspace', kind: 'domain', scopes: ['global'], meaning: 'Checked repository root.' },
]
```
