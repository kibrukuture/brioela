# Build-Guide Rules — Do Not Drift From These

Read this file before touching any build-guide folder or any code file.
If a new pattern is introduced that contradicts these rules, update this file first.
If this file and a build-guide file conflict, this file wins.

---

## Rule 1 — Feature-First Organization

The build-guide is organized by feature. Each feature gets one folder. Everything that
feature needs — including its tools, its UI, its backend, its data model — is described
inside that feature's folder. Nothing is extracted into a separate "tools folder" or
"shared folder" in the build-guide.

```
build-guide/
  07-cooking-session/         ← one feature
    00-overview.md
    01-cooking-agent-do.md
    02-gemini-live-connection.md
    03-proactive-speech-engine.md
    04-tools-this-feature-needs.md   ← tools described HERE, inside the feature
    05-timer-system.md
    ...
```

The `implementable-specs/brioela-tools/` files and `proactive-speech-engine/` files are
SOURCE MATERIAL for reading — they inform what gets written inside the relevant feature
folder. They are not separate build-guide features of their own.

---

## Rule 2 — Tool Code Lives Under tools/{feature}/

When the actual code is written, all tools for a feature live under:

```
tools/
  cooking-agent/
    set-timer.ts
    write-memory.ts
    propose-constraint.ts
  product-scan/
    check-constraint.ts
    log-find.ts
  bela/
    release-escrow.ts
    check-constraint-for-order.ts
  ground/
    submit-find.ts
    run-ai-gate.ts
  index.ts          ← exports ALL tools from ALL features — single access point
```

`tools/index.ts` is the only import path used anywhere in the codebase.
No file imports directly from `tools/cooking-agent/set-timer.ts`.
Always: `import { setTimer } from '@/tools'`

---

## Rule 3 — One File One Responsibility

Every build-guide file covers exactly one thing. If a file is trying to cover two things,
split it into two files. The file name must make the single responsibility obvious.

Bad:  `03-gemini-and-audio.md`
Good: `03-gemini-live-connection.md` + `04-audio-pipeline.md`

---

## Rule 4 — Numerical Order = Build Order

Files inside a feature folder are numbered. The number is the order they must be built.
File `03` cannot be started until file `02` is working. If a dependency changes, renumber.

---

## Rule 5 — No Feature Is an Island

Every feature folder must have a section in its `00-overview.md` called
"What This Feature Depends On" and "What Depends On This Feature."
This makes the dependency graph explicit and prevents building in the wrong order.

---

## Rule 6 — Tools Are Not a Feature

`brioela-tools/` specs describe individual tools. Tools are not built as a standalone
feature. They are built as part of whichever feature needs them, described in that
feature's build-guide folder, and the code lands in `tools/{feature}/`.

---

## Rule 7 — Design System First, Always

No feature UI is written until `build-guide/01-design-system/` is complete.
Every component, every color, every spacing value, every font choice — comes from
the design system. If the design system does not have an answer, add it there first.
Never solve a UI problem inline in a feature file.

---

## Rule 8 — Specs Are Read-Only Source Material

The `brioela-specs/` and `implementable-specs/` files are never edited when building.
They are the source of truth for what to build. If a spec is wrong or incomplete,
note it in `_records/inventory/inventory.md` and flag it — do not silently change it.

---

## Rule 9 — Record Every Connection

Every time a build-guide file is written, the connection between that file and its
source spec(s) must be recorded in `_records/connections/` immediately.
A build-guide file with no recorded connection is a gap — find the source spec.

---

## Rule 10 — Session Log Is Sacred

The last file in `_records/session-log/` is always current. Before ending any session,
write or update the session log. This is not optional. Context compaction happens.
The session log is how work continues after it does.
