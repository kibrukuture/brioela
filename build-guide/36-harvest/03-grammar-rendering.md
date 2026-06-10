# Harvest — Grammar Rendering and Archive

## What This File Covers

How the edition renders and persists.

## Source Specs

- `brioela-specs/49-harvest.md`
- `brioela-specs/42-brioela-generative-grammar.md`

## Rendering

- The edition's BrioelaGenerativeUiDocument set is composed at generation time and **stored** — opening the artifact renders instantly from stored documents. The 400ms enhancement budget never applies here.
- Full-screen paged story. Per-chapter mood, motion, haptics, Skia treatments from the grammar's primitive families. This is the most expressive surface in the app — the whimsy budget spent in the right place.
- No safety surfaces, no payment surfaces exist inside the edition, so it is fully generative by design within the grammar's validation.

## Offline

Editions render fully offline once generated (stored documents + local data). Anniversary day in a dead zone still works.

## Archive

- `harvest_edition` + `harvest_chapter` rows in the Brain DO. Permanent. Past years remain viewable — shelves of personal history.
- Listed in the user's content inventory; deletable individually.

## Data Model

```sql
harvest_edition (
  edition_id, user_id, year_index, period_start, period_end,
  chapter_count, document_set_json, generated_at, opened_at nullable
)

harvest_chapter (
  chapter_id, edition_id, chapter_type, headline, body,
  source_queries_json,           -- traceability, mandatory
  share_card_ref,                -- user-scoped R2 object
  shared boolean, rank
)
```

## Rule

Static base first does not apply here (pre-composed), but validation still does: a document that fails grammar validation falls back to a plain typographic rendering of the chapter text. The story never breaks.
