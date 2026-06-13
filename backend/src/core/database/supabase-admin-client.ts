import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type BrioelaNonTypedDb = { brioela: Record<string, unknown> }

let supabaseAdmin: SupabaseClient<BrioelaNonTypedDb, 'brioela'> | null = null;

export function getSupabaseAdmin() {
	if (!supabaseAdmin) {
		supabaseAdmin = createClient<BrioelaNonTypedDb, 'brioela'>(
			process.env.SUPABASE_URL,
			process.env.SUPABASE_SERVICE_ROLE_KEY,
			{
				db: {
					schema: 'brioela',
				},
			}
		);
	}

	return supabaseAdmin;
}
