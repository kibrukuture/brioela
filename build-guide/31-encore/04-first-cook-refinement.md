# Encore — First Cook Refinement

## What This File Covers

How the first cooking session converges the reconstruction.

## Source Specs

- `brioela-specs/44-encore.md`
- `brioela-specs/10-mira-cooking-voice.md`

## Session Injection

When a Mira session starts on a recreated recipe, the session context payload additionally carries:

- the recipe's open questions
- the confidence map (which fields are estimated)
- the technique notes inferred from visual evidence

## Taste-Check Budget

- At most one or two taste-check questions per session, tied to open questions only.
- Asked at natural moments (a tasting step, a pause) — never interrupting active work.
- Example shape: "when you taste the sauce, tell me if it's closer to cumin or caraway — I'll update the recipe."

## Post-Cook Writes

The standard post-session workflow additionally writes:

- resolved open questions (`encore_open_question.resolved = true` + resolution note)
- field refinements (`encore_refinement` rows: field, old, new, evidence)
- the user's overall verdict ("close" / "sweeter" / etc.) → re-ranks remaining uncertain fields

## Convergence

After one or two cooks the reconstruction stabilizes (`status = 'stable'`) and behaves as a normal library recipe. Origin context is preserved forever — the Time Machine can surface "first tasted in Rome, 14 months ago."

## Rule

Refinement questions stop when open questions run out. A stable recipe is never re-interrogated.
