# 34. Universal Visual Intake

## Goal

Let the user photograph anything. The agent decides what the image is, whether it is relevant to knowing the user more deeply, what memory domain it belongs to, whether a new capability should be unlocked, and what — if anything — to discard. No category list. No UI mode switching. Pure agent judgment.

## The Core Idea

Every other feature in Brioela has a defined input: scan a barcode, share a recipe URL, photograph a receipt. This feature has no defined input. The input is whatever the user points their camera at.

The agent's job: classify, decide, route. Everything else is automatic.

This is the closest Brioela gets to a true Hermes-like agent — a system that builds a complete, multi-dimensional picture of a person from passive observation, not from forms, not from settings, not from explicit declarations. The user just shows it things. The agent learns.

## Memory vs Skills — The Distinction That Must Not Be Blurred

Before anything else: a photo almost never creates a skill. It almost always updates memory. These are different things and must stay separate.

**Memory (declarative)** — facts about the user. "Takes metformin 500mg." "Has a dog." "Visited Japan in June." "Blood pressure reading 138/88." These are stored in `user_memory` and `user_personality`. They tell the agent WHO the user is.

**Skills (procedural)** — reusable how-to instructions the agent follows. "When this user asks about food safety, cross-reference their medication list before answering." "When cooking sessions involve a user with an infant, suggest faster prep times." These are stored in the `skills` table. They tell the agent HOW to serve this user better.

A prescription photo → writes a medication fact to `user_memory` (declarative). But it may ALSO cause the agent to create a skill: "I should now always check drug-food interactions for this user during any food discussion." That skill creation is the agent's own judgment call — it decides whether the new memory fact warrants a new procedural skill. Usually: memory only. Occasionally: memory + skill.

This is the same distinction Hermes makes. Most input → memory. Skills are rare and earned from patterns.

## What Happens When a Photo Is Submitted

1. The image goes to the Vision classification pipeline (a single Gemini vision call — not a streaming session).
2. The model returns a **structured JSON object** — not free text:

```json
{
  "shouldProcess": true,
  "category": "health",
  "reasoning": "prescription bottle label visible, drug name readable",
  "memoryUpdates": [
    {
      "table": "user_memory",
      "category": "health",
      "key": "medications",
      "value": "metformin 500mg, twice daily",
      "confidence": 0.91
    }
  ],
  "personalitySignals": [],
  "newSkill": {
    "create": true,
    "name": "medication-aware-food-guidance",
    "description": "Cross-reference user medication list for interactions before any food recommendation",
    "content": "...(full procedural markdown)..."
  }
}
```

The `newSkill` field is null in the vast majority of cases. The model only proposes a skill when it identifies a genuinely reusable procedure — not just a fact.

3. The Orchestrator DO handler parses the JSON, writes `memoryUpdates` to the appropriate tables, and conditionally calls `skill_create` if `newSkill.create` is true.
4. Everything is silent. The user receives a one-line confirmation only when a new skill is created for the first time.

## Classification Domains

The agent is not constrained to these. These are examples of what it knows to do with common inputs. Novel inputs are handled by the agent's general reasoning.

### Food
The agent recognizes food products, meals, restaurant dishes, homemade cooking, ingredients in a bowl, produce at a market. Routes to the food memory domain. Updates scan history if it's a product, adds a meal log if it's a cooked dish, notes a new ingredient preference if the user seems to be cooking with something regularly.

### Medication / Prescription
The agent recognizes pill bottles, blister packs, medication packaging, prescription labels. Extracts the drug name where visible.

Calls `memory_update` with `namespace = "health.medications"`, `key = <drug name>`, `value = { dose, frequency }`. This fact is now permanent in `user_memory` and injected into every session context going forward. Scan verdicts automatically check drug-food interactions for any entry in `health.medications`. The AI may also create a procedural skill if it judges the behavioral change complex enough to warrant one — but the memory write always happens regardless.

### Health Signals
The agent recognizes health-relevant visual information the user chooses to share: a glucose monitor reading, a blood pressure cuff display, a stool photo (the Bristol Stool Scale is real clinical medicine and Brioela can use it), a rash that might be a food reaction, a food diary page, a nutrition label photographed separately from a product scan.

For stool: the agent classifies against the Bristol Stool Scale (types 1–7), notes the date, cross-references with what was eaten in the last 24–48 hours using scan and receipt history. If a pattern emerges (type 6–7 consistently after a specific product), the agent flags it — not as a diagnosis but as a pattern signal. This is the same mechanism as the food illness detective (spec 30) but driven by a photo rather than a voice report.

For glucose readings, blood pressure, or other clinical numbers: written to a `health_signals` memory domain. If the number is outside a range associated with an active medical condition (spec 28), the agent notes the correlation silently — it does not alarm the user unless a pattern is clear.

### Lifestyle and Personality
The agent recognizes context from images that tell it something real about the user as a person: a dog, a gym, a bookshelf, a garden, a baby, a piece of sports equipment, a cultural item, a type of neighborhood.

Individual observations go to `user_memory` via `memory_update`. The agent picks an appropriate namespace:

- Photo of a dog → `namespace = "relationships.pets"`, `key = "dog"`, `value = { present: true, signal: "pet_owner" }`
- Photo of a home garden → `namespace = "preferences.lifestyle"`, `key = "gardening"`, `value = { grows: ["herbs", "vegetables"], signal: "organic_interest" }`
- Photo of a gym bag → `namespace = "personality.fitness"`, `key = "gym"`, `value = { active: true, observed_count: 1 }`
- Photo of a baby → `namespace = "relationships.household"`, `key = "infant"`, `value = { present: true, affects: ["meal_complexity", "prep_time"] }`

When multiple observations in the same domain accumulate enough signal, the agent also writes to `user_personality` — a synthesized trait rather than an individual fact. One gym photo → `user_memory` only. Three gym photos over three weeks → `user_personality` trait `"fitness-focused"` with rising `strength`. The agent decides when the pattern is strong enough to graduate to a trait. No developer defines when that threshold is.

### Location and Travel Context
A photo of a beach, a landmark, an airport departure board, a street in a foreign city — the agent infers location context. Not precise GPS (that is a different system) but contextual location memory: "user was in Japan in June," "user visited a coastal region," "user was at an airport (travel context — activate travel intel pre-load)."

This feeds the pre-trip food intelligence feature (spec 22) even when the user never explicitly says where they are going — the agent infers it from what they show it.

### Discard
A photo of a blank wall, a blurry image, a selfie with no food or health context, a random piece of furniture, a meme screenshot, a landscape with no context. The agent decides this does not add to the user's memory profile and silently discards it. No notification. No error. The user just gets nothing back — which is the correct response.

The discard threshold is intentionally high. The agent errs toward discarding rather than writing noise to memory. A low-confidence observation is worth less than a clean memory with no noise.

## What a Medication Photo Actually Does

A medication photo writes a fact to memory. That is the primary action. What changes downstream is driven by the memory fact being present — not by a "skill" being unlocked.

**The memory write (always happens):**
The drug name, dosage, and frequency are written to `user_memory` under `category = 'health'`, `key = 'medications'`. This fact is now part of the user's permanent profile. It is injected into every session context from this point on, the same way allergies are.

**The downstream behavioral effects (driven by the memory fact):**
- Every product scan now automatically checks drug-food interactions for any medication in the user's `user_memory.medications` list. Grapefruit + statins. Vitamin K + Warfarin. Tyramine + MAOIs. The interaction check is part of the scan pipeline — it runs whenever `user_memory` contains any medications.
- Recipe suggestions are filtered against the same interaction rules.
- Voice session context includes the medication list so the AI can mention interactions proactively.
- Interaction rules live in Supabase as versioned config — not hardcoded — so they update without a deploy.

**The skill (sometimes created, AI decides):**
The agent may create a procedural skill in the `skills` table: "When this user asks about any food or product, always check `user_memory.medications` for interactions before responding." This is a procedural how-to, not a fact. The agent creates it if it judges the behavioral change is complex enough to be worth a reusable procedure. For simple single-medication cases, the memory fact alone is sufficient and no skill is created.

Medications are cumulative. Multiple medication photos → multiple entries in `user_memory.medications`. All are checked on every scan.

"I stopped taking [drug]" → agent sets `active = false` on that entry in `user_memory`. Interaction checks for that drug stop immediately.

## The Agent's Autonomy Principle

This feature is unusual in that the agent has more autonomy than any other feature in Brioela. The rules:

1. **The agent decides relevance.** It does not ask "should I remember this?" It decides. If confidence is below a threshold, it discards.
2. **The agent writes its own memory values and personality traits.** No human-designed columns for "has_dog" or "is_athletic." Facts go to `user_memory` with AI-written values. Personality traits go to `user_personality` with AI-decided trait names — the developer never predefines what traits exist.
3. **The agent decides when a skill should be created.** Most photos produce only memory updates. A skill is only created when the agent identifies a reusable procedure — something it will need to do differently for this user in every future session. Seeing a prescription bottle → memory update (always) + possible skill creation (AI decides). Seeing a dog → memory note. Seeing three gym photos → `user_personality` trait upgrade.
4. **The agent never shows its work unless asked.** It does not produce a notification every time it writes to memory. The memory update is silent. The user experiences the effect (richer context, better suggestions, new scan flags) without being told "I just learned X about you." That would feel surveillance-like. The learning is invisible; the benefit is visible.

## What the User Sees

The primary experience is nothing — which is intentional. The user takes a photo, the agent processes it, the user continues their day.

The one exception: when a new **skill activates for the first time**, the user gets a single, minimal notification:

"I noticed you take [medication]. I'll now flag any food interactions in your scans."

This is the only time the agent surfaces what it learned. It is a one-time disclosure, not a running commentary.

The user can access a "what Brioela knows about me" screen in settings that shows all active memory domains — medication, health signals, lifestyle notes, medical conditions. Everything is deletable individually.

## Integration With Existing Specs

- Medication profile feeds into spec 28 (medical condition food profile) — medications are treated like a medical condition modifier on top of any declared condition.
- Health signals feed into spec 30 (food illness detective) — stool and symptom photos are additional input to the illness investigation pipeline.
- `user_memory` and `user_personality` feed into spec 09 (orchestrator DO) context injection — every session is enriched by the full picture of who the user is.
- Location photos feed into spec 22 (pre-trip food intelligence) — `user_memory.location.visited_places` signals travel context without the user ever saying where they are going.
- Recipe session context is enriched by personality traits — the agent knows it is cooking for someone with an infant (faster prep), or a fitness-focused person (protein-dense options), purely from observed patterns.

## Data Model

### `user_memory` — Declarative facts about the user

All memory from visual intake (and from any other source) writes through `memory_update` into this table. The namespace is a dot-separated path the AI chooses. Full implementation — Zod schema, merge logic, hard cap enforcement, namespace list injection — is in spec 09 (Memory Namespace System section).

```sql
CREATE TABLE user_memory (
  id          TEXT PRIMARY KEY,    -- "${namespace}:${key}"
  namespace   TEXT NOT NULL,       -- dot-separated, max 3 levels, lowercase: "health.medications"
  key         TEXT NOT NULL,       -- specific item within namespace: "metformin", "visited_japan"
  value       TEXT NOT NULL,       -- JSON object — never a bare string
  confidence  REAL NOT NULL DEFAULT 1.0,
  source      TEXT NOT NULL,       -- 'image' | 'conversation' | 'inferred' | 'cron'
  active      INTEGER DEFAULT 1,   -- 0 = deactivated by user or agent
  updated_at  INTEGER NOT NULL
);
```

Examples of what the agent writes across all visual intake types:

| namespace | key | value (JSON object) |
|---|---|---|
| health.medications | metformin | `{ dose: "500mg", frequency: "2x daily" }` |
| health.monitoring | glucose | `{ recent_readings: ["138", "142"], unit: "mg/dL" }` |
| diet.restrictions | gluten | `{ level: "preference", not_celiac: true }` |
| life.places | japan_june_2026 | `{ region: "coastal", context: "travel" }` |
| relationships.household | infant | `{ present: true, affects: ["meal_complexity", "prep_time"] }` |
| preferences.lifestyle | garden | `{ grows: ["herbs", "vegetables"], signal: "organic_interest" }` |
| personality.fitness | gym | `{ active: true, focus: "protein", observed_count: 3 }` |

### `user_personality` — AI-inferred personality traits

Distinct from individual facts. The agent builds trait inferences over time from patterns across many observations — not from a single photo. A trait is only written here when confidence is earned from multiple signals.

```sql
CREATE TABLE user_personality (
  trait        TEXT PRIMARY KEY,  -- AI-decided, never predefined: "health_conscious", "dog_person", "outdoor_traveler"
  evidence     TEXT NOT NULL,     -- JSON array of observation IDs that support this trait
  strength     REAL NOT NULL,     -- 0.0–1.0, grows with more supporting evidence
  inferred_at  INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);
```

The AI decides what traits exist. There is no list of allowed traits. After seeing gym photos, protein supplements, and early-morning recipe choices, the agent infers `trait = "fitness-focused"` with evidence pointing to three separate signals. After one gym photo, the confidence is low; after a consistent pattern, it graduates to a real trait. This table is what makes Brioela understand the user as a person, not just as a set of food preferences.

### Other tables

- `visual_intake_event`: event_id, user_id, classification_category, classification_summary, confidence, memory_written (boolean), skill_created (boolean), created_at. No raw image stored.
- `health_signal_event`: event_id, user_id, signal_type (stool/glucose/blood_pressure/rash/other), value, bristol_scale_type (nullable), related_food_window_json, created_at.

Raw images are **never stored**. Classification and derived facts only.

### Memory Curator

The `user_memory` and `user_personality` tables need their own maintenance pass — separate from the Skills Curator — for the same reason: without it, low-confidence noise accumulates, duplicate facts pile up, and outdated entries linger forever.

The Memory Curator runs on the same DO alarm trigger as the Skills Curator (idle + interval elapsed, default 7 days). It loads all memory entries with their `read_count`, `write_count`, `last_read`, and `last_write` and makes decisions based on the full picture.

#### The Grace Period — Never Touch New Entries

Before any curator logic runs, new entries are skipped unconditionally:

```typescript
const GRACE_PERIOD_MS = 14 * 24 * 60 * 60 * 1000 // 14 days

for (const entry of allEntries) {
  const isNew = (Date.now() - entry.lastWrite) < GRACE_PERIOD_MS
  if (isNew) continue // never touch — it hasn't had time to accumulate reads yet
  
  // proceed with evaluation...
}
```

Without this, a newly written entry that hasn't been read yet looks like garbage to the curator. The 14-day window gives every new entry a fair chance before it is ever evaluated.

#### The Decision Matrix

The curator agent sees all entries with their counts and applies this logic:

```
read_count > 50  AND  write_count > 1                → core memory — never touch
read_count = 0   AND  last_write > 30 days ago        → archive candidate
write_count = 1  AND  confidence < 0.4                → low-confidence single observation — flag for review
namespace has only 1 key  AND  read_count = 0         → probably a one-off — merge or archive
two namespaces are semantically similar               → propose merge
read_count > 10  AND  last_read < 90 days ago         → was important, now dormant — flag as stale
```

A real example of what the curator sees:

```
namespace: health.medications
  metformin:  read=847, write=3, confidence=1.0, last_read=today    → core, untouchable

namespace: food.snacks.afternoon
  crackers:   read=0,   write=1, confidence=0.3, last_write=45d ago  → archive candidate

namespace: life.misc
  random_obs: read=0,   write=1, confidence=0.2, last_write=60d ago  → garbage, propose delete
```

The metformin entry is untouchable — high read, updated multiple times, core to every health session. The other two are clearly noise. The curator proposes archiving or deleting them.

#### What the Curator Never Does

- Never deletes automatically. It proposes; the agent confirms with `memory_update(active: 0)` or the user confirms via the "what Brioela knows about me" screen.
- Never touches `user_personality` traits that have `strength > 0.7` — high-confidence inferred traits are protected.
- Never touches entries within the 14-day grace period, regardless of counts.

#### The Self-Fulfilling Prophecy Guard

`read_count` alone cannot be the only signal. Some namespaces are always loaded (health, diet) because they are always relevant — their counts explode while less-used namespaces look like garbage even if they hold important context. The curator weighs `last_write` recency alongside `read_count` to distinguish between "genuinely unused" and "not yet relevant." Something written recently is never garbage — give it time.

## Technical Constraints

- Classification is a single Gemini vision call (standard, not Live). Not a streaming session. Target latency: under 2 seconds.
- The classification result is a structured JSON object parsed by the Orchestrator DO handler — not a free-text response.
- All memory writes go through `memory_update` — the single write path. The AI never writes directly to SQLite.
- Drug-food interaction rules live in Supabase as a versioned config table: `drug_food_interaction` (drug_name, food_ingredient, interaction_type, severity, description). Updated without a deploy.
- `read_count` increments are fire-and-forget — never awaited, never allowed to block a session response.

## Privacy

- This is the most sensitive feature in Brioela. Health signals, medications, and lifestyle inferences are among the most personal data that exists.
- Nothing is shared, sold, or used for any purpose outside the user's own personalization.
- The "what Brioela knows about me" screen is mandatory — users must be able to see and delete every inferred fact.
- Medical and medication data is encrypted at rest in DO SQLite.
- The agent never speaks about what it inferred in a public context (community notes, shared recipes, any shared surface).

## Success Metrics

- Visual intake submission rate (users who actually use this beyond food scanning).
- Classification accuracy (manual audit of sampled events — is the agent making reasonable decisions?).
- `health.medications` namespace population rate among users who submit prescription photos.
- Medication scan flag engagement (user taps the drug-food interaction flag to read more).
- Lifestyle memory accumulation rate per user over 30/60/90 days.
- Retention impact: users with rich lifestyle memory profiles vs. users with only food data.
