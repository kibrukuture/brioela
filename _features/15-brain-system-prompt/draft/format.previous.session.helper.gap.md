# Draft: format.previous.session.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.previous.session.helper.ts`

**Gap (feature 15):** Block 9 thin wrapper — build-guide inlines this in builder sample.

---

## Intended production file (full snapshot — not yet created)

```typescript
export function formatPreviousSession(outcomeSummary: string): string {
	return ['## Previous Session', outcomeSummary.trim()].join('\n')
}
```

Source: `build-guide/05-brain/03-session-lifecycle.md` line 114.
