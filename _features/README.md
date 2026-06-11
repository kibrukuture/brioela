# Features

Numbered folders sort in **build order**: lower number = heavier foundation, build first.

Each feature folder will eventually hold:

- `spec.md` — behavior contract
- `build.md` — file list + acceptance (no code)
- `status.md` — open / partial / shipped + blocked-by
- `draft/` — review code; frozen snapshot after ship

Cross-cutting rules live in `00-patterns/` (not a shippable feature).

Old docs (`implementable-specs/`, `build-guide/`, ledgers) migrate here one feature at a time. Do not delete source docs until that feature is fully migrated and approved.
