# Draft: create.database.helper.ts

Target: `backend/src/agents/brain/_database/create.database.helper.ts`

```ts
import { drizzle } from '@/database/sqlite/_database'
import * as schema from '@/agents/brain/_schemas'

export function createDatabase(storage: DurableObjectStorage) {
	return drizzle(storage, { schema })
}
```
