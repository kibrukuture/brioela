# Draft: is.non.latin.query.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/is.non.latin.query.helper.ts`

**Gap (feature 16):** Script detection for FTS table routing per `implementable-specs/brioela-tools/17-search-session-history.md`.

---

## Intended production file (full snapshot — not yet created)

```typescript
const NON_LATIN_SCRIPT_PATTERN = /[؀-ۿሀ-፿一-鿿぀-ゟ゠-ヿ]/

export function isNonLatinQuery(query: string): boolean {
	return NON_LATIN_SCRIPT_PATTERN.test(query)
}

export type SessionsFtsTable = 'sessions_fts' | 'sessions_fts_trigram'

export function resolveSessionsFtsTable(query: string): SessionsFtsTable {
	return isNonLatinQuery(query) ? 'sessions_fts_trigram' : 'sessions_fts'
}
```

Source: `implementable-specs/brioela-tools/17-search-session-history.md` lines 53–61.
