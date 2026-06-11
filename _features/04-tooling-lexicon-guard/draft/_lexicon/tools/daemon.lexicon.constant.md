# Draft: _lexicon/tools/daemon.lexicon.constant.ts

Target: `tools/brioela-lexicon-guard/_lexicon/tools/daemon.lexicon.constant.ts`

```typescript
import type { LexiconWord } from '../../_types'

export const toolsDaemonLexicon: LexiconWord[] = [
  { word: 'daemon', kind: 'platform', scopes: ['tools'], meaning: 'Operating-system background process.' },
  { word: 'launchctl', kind: 'platform', scopes: ['tools'], meaning: 'macOS command for controlling launchd services.' },
  { word: 'launchd', kind: 'platform', scopes: ['tools'], meaning: 'macOS daemon supervisor.' },
  { word: 'plist', kind: 'platform', scopes: ['tools'], meaning: 'macOS property list file.' },
]
```
