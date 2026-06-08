# Brain Memory — Brain maintenance and Behavior Pattern Passes

## What This File Covers

The three BrainMaintenanceAgent passes (skill maintenance, trait decay, trait inference) and the BehaviorPatternAgent pass. This file covers only the logic of the passes — the Brain-owned child Agent architecture and typed Brain RPC boundary are documented in `05-brain/04-sub-agents.md`.

---

## BrainMaintenanceAgent — Three Passes in Order

The Brain maintenance runs once every 7 days per user. It runs sequentially — Pass 1 completes before Pass 2 starts, Pass 2 completes before Pass 3 starts. The order matters: skill maintenance (Pass 1) produces a clean skill state that trait inference (Pass 3) reads from.

---

### Pass 1 — Skill Maintenance (user skills only)

Goal: keep the skills table clean. Archive skills that are stale or never used. Never touch system skills (`source = 'system'`).

The Brain maintenance calls `get_skills_for_brain_maintenance` (a Brain maintenance-only read tool) to fetch all user skills. For each skill it evaluates:

```typescript
// Brain maintenance's evaluation per skill

const age_days  = (Date.now() - skill.createdAt) / 86_400_000
const idle_days = skill.lastUsedAt
  ? (Date.now() - skill.lastUsedAt) / 86_400_000
  : age_days   // null lastUsedAt means never used — age = idle

// Rule 1: Never used + old → archive
if (skill.useCount === 0 && age_days > 30) {
  → call archive_user_skill(name, reason: 'never used: 0 use_count after 30 days')
  continue
}

// Rule 2: Rarely used + long idle → archive
if (skill.useCount < 3 && idle_days > 60) {
  → call archive_user_skill(name, reason: `stale: use_count=${skill.useCount}, last_used ${idle_days.toFixed(0)} days ago`)
  continue
}

// Rule 3: Status = 'stale' (Brain maintenance previously flagged it) + now meets archive criteria
if (skill.status === 'stale' && idle_days > 30) {
  → call archive_user_skill(name, reason: 'stale: no recovery in 30 days since stale flagging')
  continue
}

// Rule 4: Borderline (use_count 3–5, idle 30–59 days) → mark stale but don't archive
if (skill.useCount >= 3 && skill.useCount <= 5 && idle_days > 30) {
  // Brain maintenance calls a brain-maintenance-only update — not archive_user_skill
  → write to agent_state: 'brain_maintenance.stale_flag.{skillName}' = JSON.stringify({ flaggedAt: Date.now() })
  // skill.status stays 'active' but the flag is noted
  continue
}

// Otherwise: skill is healthy — no action
```

Mass deactivation guard: if Pass 1 would archive more than 5 skills in one run, the Brain maintenance pauses and writes a `brain_maintenance.anomaly.{runId}` entry to `agent_state` with `type: "mass_archive_threshold"`. It archives the 5 least-used skills and defers the rest to the next Brain maintenance run. This prevents a runaway brain maintenance pass from decimating a healthy skills table.

---

### Pass 2 — Personality Trait Decay

Goal: keep the `user_personality` table accurate. Decay traits that are no longer supported by current behavior. Archive traits that fall below the strength floor.

The Brain maintenance calls `get_personality_traits_for_brain_maintenance` to fetch all active traits. For each trait:

```typescript
const days_since_seen = (Date.now() - trait.lastSeenAt) / 86_400_000

// Step 1: Fetch the supporting user_memory entries
const evidence_ids: string[] = JSON.parse(trait.evidence)
const live_evidence = evidence_ids.filter(id => {
  const entry = db.select().from(userMemory).where(eq(userMemory.id, id)).get()
  return entry?.active === 1   // only count evidence that is still active
})
const dead_evidence = evidence_ids.length - live_evidence.length

// Step 2: Check for NEW supporting evidence (user_memory entries in same domain written since last Brain maintenance run)
// The Brain maintenance identifies supporting evidence by namespace pattern matching against the trait
// e.g. trait 'stress-eater' → look for new user_memory entries in 'diet.*' written in the last 7 days
const new_supporting_count = countNewSupportingEvidence(trait, db)
const new_contradicting_count = countNewContradictingEvidence(trait, db)

// Step 3: Apply strength delta
let strength_delta = 0

if (new_supporting_count > 0) {
  strength_delta += 0.05 * Math.min(new_supporting_count, 3)  // cap at +0.15 per run
}
if (new_contradicting_count > 0) {
  strength_delta -= 0.10 * new_contradicting_count
}
if (days_since_seen > 30 && new_supporting_count === 0) {
  strength_delta -= 0.03  // passive time decay
}
if (dead_evidence > 0) {
  strength_delta -= 0.05 * dead_evidence  // evidence that was deactivated
}

const new_strength = Math.max(0, Math.min(1, trait.strength + strength_delta))

// Step 4: Apply
if (new_strength < 0.15) {
  → call archive_personality_trait(trait.id)
} else {
  → call update_personality_trait(trait.id, {
      strength: new_strength,
      evidence: live_evidence,
      lastSeenAt: new_supporting_count > 0 ? Date.now() : trait.lastSeenAt,
      revisedCount: trait.revisedCount + 1,
    })
}
```

---

### Pass 3 — Trait Inference (New Trait Discovery)

Goal: synthesize new personality traits from patterns that have accumulated in `user_memory` but have not yet been recognized as traits.

The Brain maintenance reads all active `user_memory` entries, clusters them by namespace, and asks the LLM whether any clusters suggest a stable personality trait not yet in `user_personality`.

```typescript
// Brain maintenance system prompt for Pass 3

const PASS_3_PROMPT = `
You are running personality trait inference for one Brioela user.
You will receive:
1. All active user_memory entries (namespace:key → value)
2. All existing active personality traits (so you do not duplicate)

Your job: identify NEW personality traits that emerge from patterns across the memory entries.

Rules for a valid new trait:
- Must be supported by at least 3 distinct user_memory entries (count evidence_ids)
- Must NOT be a trait already in the existing traits list
- The user has not explicitly contradicted this pattern in any memory entry
- The trait name must follow: lowercase, hyphens only, max 64 chars
- The summary must be specific to THIS user — not a generic label definition
- Initial strength must reflect evidence count: 3 entries → 0.4, 5 entries → 0.6, 8+ entries → 0.75+
- Confidence >= 0.65 required to create

Return a JSON array. Empty array if no new traits found. For each trait:
{
  "trait":     string,        // e.g. "grandma-cook"
  "summary":   string,        // user-specific paragraph
  "evidence":  string[],      // user_memory IDs (namespace:key strings) from the evidence
  "strength":  number         // 0.4–0.75 based on evidence count
}
`
```

For each trait returned, the Brain maintenance calls `create_personality_trait` (a Brain maintenance-only write tool — not in the 17 agent tools). This is not the agent creating traits mid-conversation — it is the Brain maintenance's exclusive synthesis operation.

---

## BehaviorPatternAgent — Behavioral Pattern Pass

Runs every 14 days. Reads `memory_event` rows (NOT `user_memory` — raw events, not derived facts) and looks for behavioral correlations that should be written to `user_memory` under the `patterns.*` namespace.

### What It Looks For

```typescript
const BEHAVIOR_PATTERN_PROMPT = `
You are Brioela's behavioral behavior pattern detection agent.
You have the user's food event history from the last 14 days.

Find behavioral patterns the user probably does not consciously know about.

Good patterns:
- Specific foods correlated with changes in other behavior
- Time-of-day or day-of-week eating patterns
- Scan-but-never-buy patterns (systematic avoidance vs browsing)
- Ingredient co-occurrence in scanned products

Bad patterns (do not report):
- Fewer than 3 occurrences
- Something the user already explicitly told Brioela (check user_memory before reporting)
- Generic observations ("user scans mostly at lunch") — must be specific enough to be actionable

Only report patterns with confidence >= 0.65 and evidence_count >= 3.

Return JSON array. Each item:
{
  "namespace":      "patterns.{domain}",
  "key":            "snake_case_behavior_pattern_name",
  "value":          "{ description: string, first_seen: number, occurrences: number }",
  "confidence":     number,
  "source":         "cron"
}
`
```

For each pattern returned, BehaviorPatternAgent asks Brain to write memory through typed Brain RPC, writing to the `patterns.*` namespace. These entries look like any other `user_memory` entry to Mira — they are injected into session context the same way, available for Mira to reference.

The Brain maintenance's Pass 3 (trait inference) reads these `patterns.*` entries as potential trait evidence on its next run — a pattern that persists across multiple BehaviorPatternAgent passes can graduate to a `user_personality` trait.

---

## What the Brain maintenance Never Does

- Never modifies `constraints` — too safety-critical
- Never modifies `memory_event` — append-only
- Never modifies `session_turns` — historical record
- Never calls `delete_user_skill` — that is an irreversible agent action, not a maintenance action
- Never runs while a session is active (checks `active_session_id` in `agent_state` before starting)
- Never archives more than 5 skills per pass without triggering the mass-archive anomaly flag
