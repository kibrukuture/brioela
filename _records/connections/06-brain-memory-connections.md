# Connections — Brain Memory

Status note: `[x] done` in this file means the spec-to-build-guide connection has been documented. It does not mean backend implementation exists. Backend implementation status is tracked in `_records/implementation-ledger/brain/` and layer build-order files.

spec: implementable-specs/01-memory-event.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 1)

spec: implementable-specs/02-user-memory.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 2, namespace rules, merge logic)

spec: implementable-specs/03-user-personality.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 3)
  → build-guide/06-brain-memory/02-brain-maintenance-passes.md   [x] done (Pass 2 decay, Pass 3 inference)

spec: implementable-specs/04-skills.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 4)
  → build-guide/06-brain-memory/02-brain-maintenance-passes.md   [x] done (Pass 1 skill maintenance)

spec: implementable-specs/05-skill-versions.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 5)

spec: implementable-specs/06-constraints.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 6)

spec: implementable-specs/07-sessions.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 7)

spec: implementable-specs/08-session-turns.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 8 + FTS5 virtual tables)

spec: implementable-specs/09-recipes.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 9)

spec: implementable-specs/10-scheduled-alarms.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 10)

spec: implementable-specs/11-agent-state.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 11, all known keys)

spec: implementable-specs/12-schema-version.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (Table 12, DO startup sequence)

spec: implementable-specs/15-brain-maintenance-and-behavior-patterns.md
  → build-guide/06-brain-memory/02-brain-maintenance-passes.md   [x] done (three passes, BehaviorPatternAgent)
  → build-guide/05-brain/04-sub-agents.md        [x] done (DO pattern, HTTP forwarding)

spec: implementable-specs/18-vectorize.md
  → build-guide/06-brain-memory/03-vectorize.md        [x] done

spec: brioela-specs/34-universal-visual-intake.md
  → build-guide/06-brain-memory/04-visual-intake.md    [x] done

spec: brioela-specs/08-personal-food-brain-memory.md
  → build-guide/06-brain-memory/01-sqlite-schema.md    [x] done (memory domains)
  → build-guide/06-brain-memory/02-brain-maintenance-passes.md   [x] done (behavior pattern detection)
