# Draft: supabase.admin.client

Target: `backend/src/core/database/supabase-admin-client.ts`

```
import { createClient } from '@supabase/supabase-js';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
	if (!supabaseAdmin) {
		supabaseAdmin = createClient(
			process.env.SUPABASE_URL,
			//
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{
				db: {
					// @ts-ignore
					schema: 'schnl',
				},
			}
		);
	}

	return supabaseAdmin;
}
```
