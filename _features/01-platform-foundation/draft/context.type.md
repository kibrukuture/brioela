# Draft: context.type

Target: `backend/src/app/context.type.ts`

```
import type { Context } from 'hono'

interface User {
	id: string
	email: string | null
}

export type AppEnvironment = {
	Variables: {
		user: User
		alignRawBody?: string
	}
}

export type AppContext = Context<AppEnvironment>
```
