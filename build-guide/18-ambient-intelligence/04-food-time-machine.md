# Ambient Intelligence — Food Time Machine

## What This File Covers

How Brioela surfaces private food history as emotionally resonant inline moments without creating a timeline, dashboard, notification habit, or gamification loop.

---

## Product Rule

Food Time Machine turns food data into memory.

It is not analytics. It is not a stats screen. It is not a streak system.

It says small true things at the right moment:

- "First time with this product."
- "You've scanned this 12 times."
- "You first made this soup last winter."
- "You've been avoiding palm oil for 8 months."

The feeling should be: Brioela remembers my food life.

---

## Sources

Read from existing private data:

- `memory_event` scan and receipt events
- `recipes`
- cooking session history
- `sessions.outcome_summary`
- `user_memory`
- saved generational recipes

No new collection is required.

---

## Candidate Types

```typescript
type TimeMachineMoment = {
  id: string
  userId: string
  momentType: "first_time" | "staple_count" | "long_gap" | "on_this_day" | "milestone" | "generational_recipe"
  surface: "scan" | "recipe_open" | "app_open" | "weekly_summary"
  text: string
  entityKind: "product" | "recipe" | "ingredient" | "category" | "app"
  entityId: string | null
  salience: number
  createdAt: number
  expiresAt: number
  surfacedAt: number | null
}
```

Candidate examples:

- first scan of a product
- 10th scan of a staple product
- resuming a recipe after 90+ days
- one-year date match for a recipe actually cooked
- repeated use of a family recipe
- maintained dietary change after 60 days

---

## Weekly Computation

The weekly ambient pass builds 5 to 10 candidate moments.

Ranking heuristic:

| Signal | Salience |
|---|---|
| first-ever event | high |
| long gap or return after 90+ days | high |
| generational/family recipe used repeatedly | high |
| real one-year/on-this-day match | medium-high |
| round count milestone | medium |
| staple frequency | low, surface rarely |

Moments expire after 14 days if not surfaced.

---

## Surfacing Points

At scan:

- "First time with this product."
- "You've scanned this 12 times."

On recipe open:

- "You've made this 4 times. Last time was 3 months ago."
- "You first saved this from your grandmother 7 months ago."

On app open, rare only:

- "On this day last year you were making lentil soup."

Weekly summary:

- one "from your history" line at most

---

## Not Allowed

Do not surface:

- illness events as nostalgia
- medical condition history as memory moments
- sensitive constraints in a celebratory tone
- private guest constraints
- shame-oriented eating history
- streaks, badges, leaderboards, or rewards
- push notifications only for Time Machine moments

The feature must not make the user feel monitored or judged.

---

## Copy Rules

Good copy is factual, warm, and optional.

Use:

```text
You first tried tahini 11 months ago. Since then, you've cooked with it 6 times.
```

Avoid:

```text
Great job keeping your tahini streak alive!
```

The first observes. The second gamifies.

---

## Privacy

Time Machine moments are private derived memories.

- Do not share to Ground.
- Do not publish to community surfaces.
- Do not expose in public profiles.
- Do not include in default exports as raw data.
- Recompute from private records when possible instead of storing excess derived history.
