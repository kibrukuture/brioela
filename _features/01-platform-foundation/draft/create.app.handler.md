# Draft: create.app.handler

Target: `backend/src/app/create.app.handler.ts`

```
import '@/core/config/env'
import { Hono } from 'hono'
import { mountMiddleware } from '@/app/mount.middleware.handler'
import { mountRoutes } from '@/app/mount.routes.handler'
import type { AppEnvironment } from '@/app/context.type'

export const app = new Hono<AppEnvironment>()

mountMiddleware(app)
mountRoutes(app)
```
