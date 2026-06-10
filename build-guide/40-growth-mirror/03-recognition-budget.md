# Growth Mirror — Recognition Budget and Delivery

## What This File Covers

When and how recognition reaches the user.

## Source Specs

- `brioela-specs/53-growth-mirror.md`
- `brioela-specs/17-behavioral-food-pattern-detection.md` (shared family budget)

## The Budget (hard)

- At most **one volunteered recognition per two weeks**.
- Shares the conversational-insight family budget with patterns (spec 17) and gaps (spec 50): never two insights of any kind in the same week. Enforced in the queue.
- Candidates expire after 30 days unsurfaced — stale recognition reads as fake.
- On-demand answers ("am I getting better?") are unbudgeted. Asked is asked.

## Delivery Moments

- session end ("That béchamel didn't need me once. Three months ago it took us four interventions.")
- relevant recipe open ("Last time this felt hard. You've cooked harder since.")
- mid-session, sparingly, only when genuinely earned

Never a push notification, never a standalone card — observations are in-app, conversational surfaces.

## Output Rules

- Always specific, always evidenced. "Nice job tonight!" is banned output; "that's the fourth sauce in a row that came together without a rescue" is the format.
- Never volunteer regression. Asked directly: honest but kind, including what hasn't moved ("timing multi-dish meals is still where things wobble").
- No comparison to other users, ever.

## Data

```sql
growth_recognition (
  recognition_id, dimension, headline, evidence_refs_json,
  status check(status in ('candidate','surfaced','expired')),
  surfaced_in nullable, created_at, surfaced_at
)
```

## Suppression

Recognition dismissed twice → standard ladder: category quiets 14 days, then permanent unless re-enabled.

## Rule

Recognition is powerful because it is rare. When in doubt, hold the candidate.
