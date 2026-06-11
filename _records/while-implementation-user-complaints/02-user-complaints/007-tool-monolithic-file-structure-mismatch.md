# 007 — Tool monolithic file structure mismatch

## Complaint
The open ledger entries (`0002.skill-tools.md`, `0003.constraint-tools.md`, `0004.alarm-tools.md` etc.) propose monolithic tool file implementations (e.g. `create.user.skill.tool.ts` at the root of `_tools/`) containing inline Zod schemas, prompt strings, and logic.

However, the codebase architecture (standardized in `0008.executable-artifact-naming.md` for memory tools) requires every tool to be split across:
1. `backend/src/agents/brain/_tools/[tool-name].tool.ts` — Registering the wrapper with Vercel AI SDK.
2. `backend/src/agents/brain/_tools/_schemas/[tool-name].schema.ts` — Declaring the Zod input schema.
3. `backend/src/agents/brain/_tools/_prompts/[tool-name].prompt.ts` — Declaring the description prompt string.
4. `backend/src/agents/brain/_tools/_executables/[tool-name].executable.ts` — Declaring the logic function as `[camelCaseName]Executable`.

## What Needs to Happen
We must write all future tools using this split structure instead of the obsolete monolithic structure proposed in the ledger entries.

## Why
Violating the established tool naming and splitting convention breaks the project's folder organization rules, fails codebase consistency metrics, and goes against the executable naming law.

## Status
**OPEN.**
