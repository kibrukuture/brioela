# Draft: wrangler.jsonc vectorize bindings (gap — not configured)

Target: `backend/wrangler.jsonc` + generated `Env` interface

**Gap (feature 17):** No Vectorize bindings in production wrangler config today.

---

## Intended wrangler.jsonc addition (snippet — append to root object)

```jsonc
	"vectorize": [
		{ "binding": "SESSIONS_VEC_0", "index_name": "brioela-sessions-0" },
		{ "binding": "SESSIONS_VEC_1", "index_name": "brioela-sessions-1" },
		{ "binding": "SESSIONS_VEC_2", "index_name": "brioela-sessions-2" },
		{ "binding": "SESSIONS_VEC_3", "index_name": "brioela-sessions-3" },
		{ "binding": "SESSIONS_VEC_4", "index_name": "brioela-sessions-4" },
		{ "binding": "SESSIONS_VEC_5", "index_name": "brioela-sessions-5" },
		{ "binding": "SESSIONS_VEC_6", "index_name": "brioela-sessions-6" },
		{ "binding": "SESSIONS_VEC_7", "index_name": "brioela-sessions-7" },
		{ "binding": "SESSIONS_VEC_8", "index_name": "brioela-sessions-8" },
		{ "binding": "SESSIONS_VEC_9", "index_name": "brioela-sessions-9" },
		{ "binding": "SESSIONS_VEC_10", "index_name": "brioela-sessions-10" },
		{ "binding": "SESSIONS_VEC_11", "index_name": "brioela-sessions-11" },
		{ "binding": "SESSIONS_VEC_12", "index_name": "brioela-sessions-12" },
		{ "binding": "SESSIONS_VEC_13", "index_name": "brioela-sessions-13" },
		{ "binding": "SESSIONS_VEC_14", "index_name": "brioela-sessions-14" },
		{ "binding": "SESSIONS_VEC_15", "index_name": "brioela-sessions-15" },
		{ "binding": "SESSIONS_VEC_16", "index_name": "brioela-sessions-16" },
		{ "binding": "SESSIONS_VEC_17", "index_name": "brioela-sessions-17" },
		{ "binding": "SESSIONS_VEC_18", "index_name": "brioela-sessions-18" },
		{ "binding": "SESSIONS_VEC_19", "index_name": "brioela-sessions-19" }
	],
```

## Env interface (after `wrangler types`)

```typescript
interface Env {
	COHERE_API_KEY: string
	SESSIONS_VEC_0: Vectorize
	SESSIONS_VEC_1: Vectorize
	// ... through SESSIONS_VEC_19
	BRIOELA_BRAIN: DurableObjectNamespace
}
```

## Secrets

```bash
bunx wrangler secret put COHERE_API_KEY
```

## Account setup (before deploy)

See `build.md` checklist — create indexes + metadata indexes with wrangler ≥ 3.71.0.

**Current state:** `backend/wrangler.jsonc` has only `durable_objects`, `routes`, `migrations` — no `vectorize` key (verified).
