# 34. Universal Visual Intake

## Goal

Let the user photograph anything. The agent decides what the image is, whether it is relevant to knowing the user more deeply, what memory domain it belongs to, whether a new capability should be unlocked, and what — if anything — to discard. No category list. No UI mode switching. Pure agent judgment.

## The Core Idea

Every other feature in Brioela has a defined input: scan a barcode, share a recipe URL, photograph a receipt. This feature has no defined input. The input is whatever the user points their camera at.

The agent's job: classify, decide, route. Everything else is automatic.

This is the closest Brioela gets to a true Hermes-like agent — a system that builds a complete, multi-dimensional picture of a person from passive observation, not from forms, not from settings, not from explicit declarations. The user just shows it things. The agent learns.

## What Happens When a Photo Is Submitted

1. The image goes to the Vision classification pipeline (a single Gemini vision call — not a streaming session).
2. The agent produces a structured classification:
   - **What is this?** (free-form, AI-written description)
   - **Is this relevant to knowing this user?** (yes / no / uncertain)
   - **If yes: what memory domain does this belong to?** (food, medication, health-signal, lifestyle, location, discard)
   - **What should be written to memory, if anything?**
   - **Does this unlock or strengthen a new capability?**
3. Based on the classification, the agent routes to the appropriate handler in the Orchestrator DO.
4. Memory is written, a skill is activated or strengthened, or the image is discarded — all silently. The user receives a one-line confirmation or nothing at all.

## Classification Domains

The agent is not constrained to these. These are examples of what it knows to do with common inputs. Novel inputs are handled by the agent's general reasoning.

### Food
The agent recognizes food products, meals, restaurant dishes, homemade cooking, ingredients in a bowl, produce at a market. Routes to the food memory domain. Updates scan history if it's a product, adds a meal log if it's a cooked dish, notes a new ingredient preference if the user seems to be cooking with something regularly.

### Medication / Prescription
The agent recognizes pill bottles, blister packs, medication packaging, prescription labels. Extracts the drug name where visible.

**Unlocks the Medication Skill** (see below).

Writes to the `medication_profile` memory domain: drug name, dosage if visible, estimated frequency (from context or a single follow-up question). Updates all scan verdicts to flag drug-food interactions for that medication. Permanent until the user says they stopped taking it.

### Health Signals
The agent recognizes health-relevant visual information the user chooses to share: a glucose monitor reading, a blood pressure cuff display, a stool photo (the Bristol Stool Scale is real clinical medicine and Brioela can use it), a rash that might be a food reaction, a food diary page, a nutrition label photographed separately from a product scan.

For stool: the agent classifies against the Bristol Stool Scale (types 1–7), notes the date, cross-references with what was eaten in the last 24–48 hours using scan and receipt history. If a pattern emerges (type 6–7 consistently after a specific product), the agent flags it — not as a diagnosis but as a pattern signal. This is the same mechanism as the food illness detective (spec 30) but driven by a photo rather than a voice report.

For glucose readings, blood pressure, or other clinical numbers: written to a `health_signals` memory domain. If the number is outside a range associated with an active medical condition (spec 28), the agent notes the correlation silently — it does not alarm the user unless a pattern is clear.

### Lifestyle and Personality
The agent recognizes context from images that tell it something real about the user as a person: a dog, a gym, a bookshelf, a garden, a baby, a piece of sports equipment, a cultural item, a type of neighborhood. These do not map to a predetermined schema. The agent writes free-form observations to the `lifestyle_memory` domain using its own judgment about what is worth noting.

Examples of what it might write:
- Photo of a dog: "user has a dog (pet context — may affect food storage patterns, interest in pet-safe foods)"
- Photo of a home garden: "user grows their own herbs/vegetables — interest in organic, fresh, self-sufficiency signals"
- Photo of a gym bag and protein powder: "active fitness lifestyle — protein content, performance nutrition signals"
- Photo of a baby: "has an infant at home — may affect meal complexity preferences, time pressure, interest in quick healthy meals"

The agent decides what to write and how to weight it. There is no `personality.sql` schema designed by a human. The AI writes the schema it needs, in natural language descriptions stored in a flexible SQLite `lifestyle_memory` table (key, value, confidence, source, created_at). The agent reads this table when building context for any session, adding nuance it would not have from food data alone.

### Location and Travel Context
A photo of a beach, a landmark, an airport departure board, a street in a foreign city — the agent infers location context. Not precise GPS (that is a different system) but contextual location memory: "user was in Japan in June," "user visited a coastal region," "user was at an airport (travel context — activate travel intel pre-load)."

This feeds the pre-trip food intelligence feature (spec 22) even when the user never explicitly says where they are going — the agent infers it from what they show it.

### Discard
A photo of a blank wall, a blurry image, a selfie with no food or health context, a random piece of furniture, a meme screenshot, a landscape with no context. The agent decides this does not add to the user's memory profile and silently discards it. No notification. No error. The user just gets nothing back — which is the correct response.

The discard threshold is intentionally high. The agent errs toward discarding rather than writing noise to memory. A low-confidence observation is worth less than a clean memory with no noise.

## The Medication Skill

When the agent detects medication, it unlocks the Medication Skill in the Orchestrator DO — a capability set that was dormant before.

What the Medication Skill does:

- **Scan flag augmentation**: every product scan now checks for drug-food interactions with the identified medication. Grapefruit + statins. Vitamin K + Warfarin. Tyramine + MAOIs. These are flagged inline on the scan result, at the same priority level as a hard allergy flag.
- **Recipe filter augmentation**: recipes using high-interaction ingredients are flagged or filtered in the same way dietary conditions are handled (spec 28).
- **Voice session context**: the medication profile is injected into every cooking session so the AI can mention interactions proactively.
- **Interaction database**: drug-food interaction rules are maintained as versioned config in Supabase — not hardcoded in DO logic, so they can be updated without a deploy.

The Medication Skill is cumulative. If the user photographs two different medications, both are active and both are checked on every scan.

The user can say "I stopped taking [drug]" at any point. The agent deactivates that medication from the profile and stops checking interactions.

## The Agent's Autonomy Principle

This feature is unusual in that the agent has more autonomy than any other feature in Brioela. The rules:

1. **The agent decides relevance.** It does not ask "should I remember this?" It decides. If confidence is below a threshold, it discards.
2. **The agent writes its own memory schema for lifestyle data.** No human-designed columns for "has_dog" or "is_athletic." The agent writes what it observed in natural language, with a confidence score.
3. **The agent decides when a skill should activate.** Seeing a prescription bottle once is enough to activate the Medication Skill. Seeing a dog once might write a low-confidence note. Seeing a gym three times builds the confidence to write a higher-weight lifestyle signal.
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
- Lifestyle memory feeds into spec 09 (orchestrator DO) context injection — the agent has richer context for all sessions.
- Location photos feed into spec 22 (pre-trip food intelligence) — agent infers travel context without explicit declaration.
- Recipe session context is enriched by lifestyle memory — the agent knows it's cooking for someone with an infant, or someone who lifts weights, without being told.

## Data Model

- `visual_intake_event`: event_id, user_id, classification_domain, classification_summary, confidence, memory_written (boolean), skill_activated (nullable), created_at. No raw image stored after processing.
- `medication_profile`: user_id, drug_name, dosage (nullable), frequency (nullable), confidence, source (photo/voice), active (boolean), detected_at, deactivated_at.
- `lifestyle_memory`: entry_id, user_id, key (free-form, AI-written), value (free-form, AI-written), confidence (0.0–1.0), source_event_id, created_at, updated_at.
- `health_signal_event`: event_id, user_id, signal_type (stool/glucose/blood_pressure/rash/other), value (free-form), bristol_scale_type (nullable), related_food_window_json, created_at.

Raw images are **never stored**. Classification and derived facts only. The image is processed in memory, the result is written, the image is discarded.

## Technical Constraints

- Classification is a single Gemini vision call (standard, not Live). Not a streaming session. Target latency: under 2 seconds.
- The classification result is a structured JSON object parsed by the Orchestrator DO handler — not a free-text response.
- Lifestyle memory is an unstructured table — key and value are free-form strings written by the model. This is intentional. No schema migration needed when the agent learns a new type of lifestyle signal.
- The Medication Skill activation writes a `skill_activated` event to the DO and persists the medication profile. The skill is loaded on every subsequent scan verdict call.
- Drug-food interaction rules live in Supabase as a versioned config table: `drug_food_interaction` (drug_name, food_ingredient, interaction_type, severity, description). Updated by the team, not hardcoded.

## Privacy

- This is the most sensitive feature in Brioela. Health signals, medications, and lifestyle inferences are among the most personal data that exists.
- Nothing is shared, sold, or used for any purpose outside the user's own personalization.
- The "what Brioela knows about me" screen is mandatory — users must be able to see and delete every inferred fact.
- Medical and medication data is encrypted at rest in DO SQLite.
- The agent never speaks about what it inferred in a public context (community notes, shared recipes, any shared surface).

## Success Metrics

- Visual intake submission rate (users who actually use this beyond food scanning).
- Classification accuracy (manual audit of sampled events — is the agent making reasonable decisions?).
- Medication Skill activation rate among users who submit prescription photos.
- Medication scan flag engagement (user taps the drug-food interaction flag to read more).
- Lifestyle memory accumulation rate per user over 30/60/90 days.
- Retention impact: users with rich lifestyle memory profiles vs. users with only food data.
