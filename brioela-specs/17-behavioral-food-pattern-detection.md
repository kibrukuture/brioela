# 17. Behavioral Food Behavior Pattern

## Goal
Detect food-related behavior patterns over time and surface useful interventions only when the confidence and usefulness are high enough. All data collection is passive — the user is never asked to log, rate, or report anything.

## Core Rule: No Explicit Data Collection

The user is never prompted to rate how they feel, log their energy, or track their mood. Brioela is a companion, not a form. Data collection happens entirely during interactions the user is already in — cooking sessions, scanning conversations, voice sessions. The agent listens, infers, and learns. The user just lives.

## Example Behaviors Detected Passively

- **Energy and wellbeing patterns**: during cooking or voice sessions, the agent notes organic expressions of how the user feels — "I'm exhausted today," "I've been feeling heavy lately," "I had so much energy this morning." These are never solicited. They emerge naturally in conversation. The agent cross-references them with recent meal history (scan and receipt data) to detect correlations over time.
- **Stress eating patterns**: late-night scans, repeat purchases of specific comfort products, session tone and pacing during high-stress periods.
- **Repeated post-sickness associations**: after an illness event (spec 30), recurring scan of foods from the same category.
- **Ingredient or brand aversion**: repeated rejection of products containing a specific ingredient without the user ever naming the aversion.
- **Travel-related food preparation patterns**: behavioral changes in scanning and purchasing before and during trips.
- **Dietary drift**: gradual shift away from previously regular foods — detected from scan frequency changes, not from any declaration.

## How Energy and Wellbeing Signals Are Captured

During a cooking session or voice interaction, the Gemini Live model processes the user's full audio context. When the user mentions feeling tired, energized, unwell, or any related state, the transcript event is passed to the Brain DO as a `wellbeing_signal` event.

The signal is not acted on immediately. It is logged with a timestamp and linked to the user's recent food context (what was scanned or eaten in the preceding 12–48 hours from scan and receipt history).

Over time, the Brain DO's weekly alarm cycle runs a correlation pass: are there foods or food categories that consistently precede low-energy signals? High-energy signals? Digestive complaints?

When a correlation reaches sufficient confidence (minimum 5 consistent signal instances with the same food association), the pattern is written to `behavior_pattern` and optionally surfaced — not as a notification, but as a natural comment during a future relevant conversation: "I've noticed you tend to feel sluggish on days after eating [X]. Want me to keep an eye on that?"

The insight surfaces during conversation. Never as a dashboard. Never as an alert. Always as something the agent says to the user while already talking.

## User Outcome
- Brioela notices patterns without demanding manual tracking.
- User sees timely, narrow, practical interventions.
- The agent surfaces insights as part of ongoing natural conversation — never as standalone notifications.

## In Scope
- Event-sequence analysis over scan, receipt, voice, and wellbeing signal data.
- Pattern confidence scoring.
- Low-frequency intervention generation.
- Passive wellbeing signal capture from conversational transcript events.

## Out of Scope
- Mental health diagnosis.
- Medical or psychiatric claims.
- Any explicit user prompts to log mood, energy, or feelings.
- Any "mood tracker" UI element.

## Inputs
- Time-of-day and day-of-week scan behavior.
- Purchase repetition and category drift.
- Recipe completion rates.
- Wellbeing signals extracted from voice session transcripts (passive).
- User-expressed negative outcomes during any voice session.
- Illness events from spec 30.

## Data Model

```sql
behavior_pattern (
  user_id       text,
  behavior_pattern_type  text,    -- 'energy_correlation', 'stress_eating', 'aversion', 'dietary_drift', etc.
  evidence_json text,    -- array of event IDs and timestamps supporting this pattern
  confidence    real,
  first_seen_at integer,
  last_seen_at  integer
)

wellbeing_signal (
  signal_id        text primary key,
  user_id          text,
  signal_type      text,    -- 'energy_low', 'energy_high', 'stomach_discomfort', 'mood_low', 'mood_positive'
  source_session   text,    -- session_id where the signal was captured
  food_context_json text,   -- what was scanned/eaten in prior 12-48hrs at time of signal
  captured_at      integer
)

behavior_pattern_intervention (
  user_id           text,
  behavior_pattern_id        text,
  intervention_type text,
  surfaced_in       text,   -- session_id where the insight was mentioned conversationally
  created_at        integer,
  acted_on_at       integer
)
```

## Technical Notes
- Pattern generation uses explicit thresholds and evidence storage — not soft ML inference without audit trail.
- Wellbeing signals are extracted by the Brain DO when it processes transcript events from cooking and voice sessions.
- Interventions must be sparse to avoid feeling invasive. Maximum one new pattern insight per week.
- Sensitive patterns (health correlations) require higher confidence thresholds than behavioral patterns (brand aversion).
- Pattern correlation runs as part of the weekly DO alarm cycle — not on every session end.

## Success Metrics
- Intervention acceptance rate (user responds positively or with "tell me more" to a surfaced pattern).
- Dismissal rate.
- Wellbeing signal capture rate (how often voice sessions contain naturally-expressed wellbeing signals).
- Pattern confirmation rate (user confirms a pattern when the agent mentions it).
