# File Name Enforcement

## What This File Covers

The Brioela-scoped guard that prevents bad file and folder names from entering the codebase. Naming rules must fail fast during development, not wait for human review.

---

## Principle

Bad names are not style issues. They are architecture drift.

The codebase must make wrong names hard to create and impossible to keep. The guard runs over Brioela-owned source folders and rejects names that violate the naming convention in `03-naming-conventions.md`.

---

## Required Commands

The repo must expose two Bun commands:

```bash
bun run check:names
bun run watch:names
```

`check:names` runs once and exits non-zero on any violation. It belongs in local verification and CI.

`watch:names` stays alive during development. It watches Brioela source folders and fails loudly as soon as a bad file or folder appears. This is the preferred developer mode while creating new files.

---

## Scope

The guard watches only Brioela-owned source and docs folders:

```text
backend/
shared/
mobile/
build-guide/
implementable-specs/
brioela-specs/
_records/
```

It ignores generated output and dependency folders:

```text
node_modules/
dist/
build/
.wrangler/
.expo/
.turbo/
coverage/
```

---

## TypeScript File Rules

Every TypeScript file must be either `index.ts` or end with an approved role suffix:

```text
.route.ts
.controller.ts
.handler.ts
.helper.ts
.rpc.ts
.policy.ts
.mapper.ts
.prompt.ts
.runtime.ts
.middleware.ts
.agent.ts
.tool.ts
.schema.ts
.type.ts
.event.ts
.job.ts
.routes.ts
.lib.ts
.constant.ts
.store.ts
.hook.ts
.api.ts
.client.ts
.feature.tsx
.variants.ts
.glsl.ts
.test.ts
```

Hyphens are banned in TypeScript file names. Files use dot-case:

```text
✓ write.brain.memory.rpc.ts
✓ authorize.brain.tool.policy.ts
✓ build.mira.scene.context.handler.ts

✗ write-brain-memory.rpc.ts
✗ brain-maintenance.agent.ts
✗ context.ts
```

---

## Folder Rules

Folders use kebab-case nouns. Folders express ownership. Files express responsibility.

Valid examples:

```text
backend/src/agents/brain/
backend/src/agents/mira-session/
backend/src/agents/brain/_subagents/behavior-pattern/
shared/validator/user-memory/
```

Invalid examples:

```text
backend/src/agents/brainAgent/
backend/src/agents/brain.agent/
backend/src/common/
backend/src/temp/
```

---

## Underscore Folder Allowlist

Only these underscore folders are allowed:

```text
_handlers
_helpers
_schema
_types
_rpc
_policies
_mappers
_prompts
_runtime
_schedules
_subagents
_hooks
_components
```

Every underscore folder must contain `index.ts`.

Consumers import from the underscore folder barrel, never from an individual file inside it.

---

## Banned Names

The guard rejects these names as files, folders, type suffixes, and standalone variables where practical:

```text
utils
helpers
manager
service
common
misc
stuff
data
info
payload
result
handler
agent
new
old
temp
backup
v2
```

Exceptions:

- `_helpers/` is allowed as a scoped folder name.
- `.handler.ts` and `.agent.ts` are allowed as role suffixes.
- External API field names may be quoted exactly when required by that API.

---

## Barrel Rules

`index.ts` is barrel-only. It may export from sibling files. It may not contain business logic, classes, schemas, handlers, policies, or runtime setup.

Allowed:

```typescript
export * from './write.brain.memory.rpc'
export * from './read.brain.context.rpc'
```

Rejected:

```typescript
export async function writeBrainMemory() {}
```

---

## Test Pairing Rule

Tests live next to the file they test. A test file must match the tested file exactly:

```text
write.brain.memory.rpc.ts
write.brain.memory.rpc.test.ts

build.mira.scene.context.handler.ts
build.mira.scene.context.handler.test.ts
```

The guard rejects free-floating test names such as `brain.test.ts` when no `brain.ts` exists.

---

## Fail-Fast Behavior

The watch process should print the exact violation and the expected correction:

```text
Invalid file name:
backend/src/agents/brain/_subagents/brain-maintenance/brain-maintenance.agent.ts

Reason:
TypeScript file names use dots, not hyphens.

Use:
brain.maintenance.agent.ts
```

The script should exit non-zero in `check:names`. In `watch:names`, it should continue watching after reporting the error so the developer can rename the file and immediately see the guard turn clean.

---

## Recommended Package Scripts

```json
{
  "scripts": {
    "check:names": "bun scripts/check.file.names.ts",
    "watch:names": "bun scripts/check.file.names.ts --watch",
    "verify": "bun run check:names && bun test"
  }
}
```

The script implementation comes later. This file defines the contract it must enforce.
