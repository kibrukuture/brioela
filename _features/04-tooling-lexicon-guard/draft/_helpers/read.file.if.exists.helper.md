# Draft: _helpers/read.file.if.exists.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/read.file.if.exists.helper.ts`

```typescript
import { readFile } from 'node:fs/promises'

export async function readFileIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    void error
    return null
  }
}
```
