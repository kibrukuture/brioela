# Gap target: `tools/{feature}/` vs `agents/brain/_tools/`

**Pattern**: `build-guide/00-rules.md` Rule 2:

```text
tools/
  mira-session/
  product-scan/
  index.ts   ← single import path @/tools
```

**Shipped (Brain)**: All AI tools under `backend/src/agents/brain/_tools/` with split `_schemas`, `_prompts`, `_executables`.

**Resolution**: Brain feature docs (`05–19`) and `build-guide/05-brain/02-tool-protocol.md` supersede Rule 2 for Brain. Rule 2 may still apply to non-brain feature tools (scanner, bela) when those ship.

**Action**: Mark Rule 2 as legacy for Brain in `00-rules.md` or add explicit exception — not done yet (G-conf-1).
