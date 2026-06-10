# 30. Sift — Food Illness Detective

## Goal

When the user says they feel sick, Brioela looks at the last 24–72 hours of their food history and surfaces the most probable culprit — cross-referencing against active recalls, community illness reports, and known high-risk product patterns.

## Naming

**Sift** is the product name for this feature. "Food illness detective" remains as the description (and in this file's name and existing doc references, which are stable).

- **What it names**: the user-facing investigation moment and its result. "Brioela sifted through your last 72 hours" is the product sentence; the result screen is the Sift result.
- **Why this word**: sift is a kitchen word and an investigation word in the same syllable — sifting flour, sifting evidence. It is calm and respectful, which matters because the user invoking it feels terrible. Reclaimed-word family (Ground, Find, Passport, Tonight).
- **Why not "Trace"**: rejected for a real collision — "trace" is load-bearing safety vocabulary elsewhere in these specs (trace ingredients, trace allergens, spec 07). One word cannot mean both an investigation and a contamination quantity.
- **Where it is used**:
  - UI surfaces: the investigation entry ("I feel sick..."), the ranked-suspects result screen, the follow-up.
  - Code namespace going forward: `sift` — the Brain tool is `run_sift` (renamed from `run_illness_detective`); future tool code under `tools/sift/`.
  - What does not change: this file's name, the `build-guide/16-illness-detective/` folder, and the existing table names (`illness_report`, `illness_suspect`, `community_illness_signal`) — these predate the name, are referenced across many records, and `community_illness_signal` is shared infrastructure. They remain valid; new code and all user-facing language use Sift.
  - The boundary is unchanged by the name: Sift never diagnoses. It narrows and advises.

## Why This Exists

Foodborne illness affects roughly 1 in 6 people per year globally. The hardest part is almost never the illness itself — it is not knowing what caused it. You ate at three places yesterday. You had leftovers. You tried a new product. You don't know where to start.

Brioela has the food history. It also has community data and active recall information. The combination makes it uniquely positioned to do what a doctor, a health department, and no other consumer app can do: narrow the list to the most likely suspect, fast.

This also has a public health upside. Every time a user reports feeling sick, that signal — tied to specific products and locations — becomes an anonymized data point that can surface emerging issues before they become outbreaks.

## User Outcome

- User says (voice or tap): "I feel sick, I think it was something I ate."
- Brioela asks: "When did symptoms start?" (one question).
- Based on symptom onset, Brioela looks back at the appropriate window:
  - 1–6 hours onset: focus on the last meal (staph, bacillus, short-incubation pathogens).
  - 6–24 hours: last 2–3 meals (salmonella range).
  - 24–72 hours: everything in the window (listeria, norovirus, longer-incubation pathogens).
- Results screen: ranked list of suspects with confidence level, reason for flagging, and actionable advice.

## Suspect Ranking Logic

Each item in the food history for the relevant window is scored:

1. **Active recall match**: product is under an active recall for a pathogen. Highest weight. If the user scanned this product within the window and there is an active recall, it is ranked first with a "RECALL ACTIVE" tag.
2. **Community illness reports**: community notes from other users at the same restaurant or with the same product, reporting illness. High weight.
3. **Known high-risk category**: raw shellfish, undercooked eggs, deli meats (especially for pregnant users), unpasteurized products, rice left at room temperature (bacillus). Medium weight.
4. **New product, first time consumed**: the user ate something they haven't eaten before. This is flagged as a candidate because there is no baseline to rule it out. Medium weight.
5. **Outside food (restaurant, takeout)**: flagged as higher risk than home-cooked meals from known ingredients. Low-medium weight.

The ranked list shows the top 3 suspects with a short plain-language reason for each.

## Follow-Up Questions

After the initial ranking, Brioela may ask one or two targeted follow-up questions to refine the ranking:

- "Did anyone else who ate [the same meal/same product] also feel sick?"
- "Was the [flagged product] fully cooked?"

These are optional. The user can skip them. If answered, they adjust the ranking.

## "Others ate this too" — Community Signal

If the user confirms that someone else got sick from the same source, Brioela:
1. Logs an anonymized illness report linked to the product or restaurant.
2. If 3+ independent reports cluster around the same product or location within 72 hours, elevates to a community alert visible in community notes.
3. If the cluster grows large enough, flags for potential submission to the relevant food safety authority (user opts in to this — it is not automatic).

This turns individual illness reports into an early warning system. The product is the node; the user is the reporter. This is genuinely useful public health infrastructure built as a side effect of a consumer feature.

## Actionable Output

Beyond the suspect ranking, the results screen gives clear next steps:

- "If symptoms are severe (bloody stool, high fever, can't keep fluids down), see a doctor immediately."
- "For mild symptoms: rest, fluids, avoid [category] for 48 hours."
- "If [product] is the suspect: check the FDA recall page to see if your batch is affected" (links directly to spec 26 recall detail).
- "Consider discarding the rest of [product] until you feel better."

The app never diagnoses. It narrows and advises. Diagnosis is medical.

## Data Model

- `illness_report`: report_id, user_id, symptom_onset_time, reported_at, window_start, window_end, status (open/resolved).
- `illness_suspect`: report_id, suspect_type (product/restaurant/meal), suspect_id, confidence_score, reason_code, rank.
- `community_illness_signal`: signal_id, product_id (or restaurant_id), signal_count, window_start, window_end, elevated (boolean), created_at.

User_id is never attached to community_illness_signal — that table is fully anonymized at write time.

## Privacy

- Individual illness reports are private to the user.
- Community signals are fully anonymized — no user_id, no timestamp precision finer than 24-hour windows.
- The user explicitly opts in before any illness data is shared with authorities.
- Illness history is deleted from the user's profile on request, same as all personal data.

## Technical Constraints

- The illness window lookback queries the user's Brain DO SQLite (scan history + receipt history + recipe session history).
- Community signal aggregation runs in Supabase — it is shared data, not per-user data.
- The recall cross-reference is a real-time check against the recall_entry table populated by spec 26.
- The ranking model is a structured LLM call with the food history and recall data as context — not a streaming session. Target latency: under 2 seconds.

## Success Metrics

- Illness report submission rate (users who engage with this feature when sick).
- Follow-up question completion rate.
- Community signal elevation rate (reports that grow into community alerts).
- User-reported resolution rate ("I feel better, the culprit was [X]" — confirms the feature's utility).
- Retention impact: users who used this feature vs. those who did not.
