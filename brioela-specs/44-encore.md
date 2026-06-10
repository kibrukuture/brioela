# 44. Encore

## Goal

Let a user capture any dish they are eating — at a restaurant, at a friend's house, while traveling — and have Brioela reconstruct it into a full, cookable, personalized recipe: ingredients sourced locally via Ground, orderable via Bela, and cookable with Mira. The loop is: taste it once, cook it forever.

## Naming

**Encore** is the product name for this feature. Early drafts called it "Dish Recreation" — that phrase survives only as description, never as the name.

- **What it names**: the user-facing feature, the action, and the artifact. The camera action is the Encore action ("I want this forever"); the reconstructed recipe is "an Encore"; the user's collection of them is their Encores.
- **Why this word**: an encore is a performance repeated because the audience loved it — exactly the promise here: taste it once, have it performed again in your own kitchen. It is a plain, universal word (the reclaimed-word family: Ground, Find, Passport, Tonight), it survives translation, and it works as a verb — "Encore it" is a complete sentence.
- **Where it is used**:
  - UI surfaces: the recreate action on a plate photo, the Encores section of the recipe library, the first-cook share card.
  - Spoken: Mira understands "Encore this" as the capture trigger.
  - Code namespace: `encore` — tables `encore`, `encore_open_question`, `encore_refinement`; API `/api/encores`; recipe `source_type = 'encore'`; future tool code under `tools/encore/`.
  - Docs: this spec, `build-guide/31-encore/`, and all records use Encore. "Dish recreation" may appear lowercase as a description of what Encore does.

## Why This Exists

Every other intake path in Brioela starts from something that is already a recipe or a product: a barcode (spec 01), a shared video or URL (spec 02), a menu (spec 27), a live family session (spec 13). There is no path that starts from a finished plate of food the user is tasting right now.

This is the most common food desire that no app serves: "I want to be able to make *this*." People photograph restaurant dishes constantly and the photos die in their camera roll. Brioela has every component needed to close this loop — vision classification (spec 34), menu context extraction (spec 27), a recipe schema (spec 02), a constraint engine (spec 07), local ingredient intelligence (spec 35), grocery delivery (Bela), and a cooking coach (spec 10). Encore is the connection of those existing systems, not a new system.

It is also the highest-ceiling shareable moment in the product: "I ate this in Rome. I cooked it at home a week later." The share writes itself (spec 25).

## User Outcome

- User is eating something they love. They photograph the plate and say (voice, optional): "I want this forever" — or taps the recreate action on the photo.
- Brioela reconstructs the dish into a draft recipe within seconds: name, ingredient list with estimated quantities, steps, technique notes, confidence markers on uncertain fields.
- The recipe is automatically adapted to the user's constraint profile: allergens substituted, dietary identity respected, medical condition rules applied (specs 07, 28).
- Missing ingredients are checked against Ground finds and the healthy food map for local availability. One tap creates a Bela order for what is missing.
- When the user cooks it, Mira (spec 10) guides the session with the reconstructed recipe pre-loaded, including the technique notes inferred from the dish.
- Optionally, the recipe can be run through a style profile (spec 32): "recreate it the way grandma would make it."

## In Scope

- Plate photo capture as a recreation trigger (distinct from passive meal logging in spec 34).
- Optional voice annotation at capture time ("the sauce was smoky, there was something like cardamom in it").
- Context enrichment: restaurant identity from location, menu scan data from the same visit (spec 27), cuisine inference from scan history.
- LLM-based recipe reconstruction with explicit confidence marking.
- Constraint-aware adaptation of the reconstructed recipe.
- Ingredient sourcing handoff to Ground, the map, and Bela.
- Cooking session handoff to Mira with reconstruction notes injected.
- Post-cook refinement loop: after cooking, the user's verdict refines the reconstruction.

## Out of Scope

- Claiming exact replication. The output is an interpretation, always labeled as reconstructed.
- Publishing reconstructed recipes to any community surface. Reconstructions are private to the user.
- Nutrition labeling of the reconstruction (estimates only, never presented as measured).
- Chemical or lab-grade flavor analysis. The input is a photo, optional voice notes, and context — nothing else.

## The Capture Moment

Capture is one action: photograph the plate. Everything else is optional enrichment.

1. **Photo (required)** — one or more frames of the dish. Multiple angles improve reconstruction but are never demanded.
2. **Voice note (optional)** — the user can say what they taste. The transcript is attached to the reconstruction context. Audio is discarded after transcription, same rule as Ground voice-to-find (spec 35).
3. **Context (automatic, never asked)**:
   - Location → restaurant identity from the places database, if known.
   - A menu scan from the same location within the same visit (spec 27) → the dish name and printed description, the single strongest reconstruction signal.
   - The user's cuisine history → prior probability on flavor base and technique.
   - Time of day, course position (from what else was photographed this meal).

The user is never asked a single question at capture time. If the dish name is unknown, the reconstruction proceeds from visual evidence alone and says so.

## Reconstruction Pipeline

Reconstruction is an async multi-step flow via Upstash Workflow — not a streaming session. The user gets an immediate acknowledgment ("Working on it — I'll have a recipe shortly") and the draft arrives as a high-priority in-app surface, push only if the user has left the app (spec 23 rules).

```text
step 1: visual analysis — GPT-4o mini vision extraction over the plate photo(s):
        visible components, cooking methods evident (sear marks, braise sheen,
        char, emulsification), garnishes, portion structure
step 2: context fusion — merge menu text (if any), voice note transcript,
        restaurant cuisine type, user cuisine priors
step 3: recipe reconstruction — single structured LLM call producing the
        canonical recipe schema from spec 02 (user_recipe shape) with
        per-field confidence
step 4: constraint adaptation — run the draft through the user's full
        constraint profile (spec 07, 28); substitutions annotated and
        attributed ("swapped for your allergy", "reduced for your condition")
step 5: sourcing check — match ingredient list against Ground
        location_signal_summary and map product sightings near the user's
        home location; mark each ingredient: have (pantry inference),
        nearby, or hard-to-find with closest known source
```

Every uncertain quantity or ingredient is marked `estimated` — the same nullable/confidence schema as spec 02. The reconstruction never fabricates certainty. If the model cannot identify a component, the recipe says "an unidentified green sauce — likely herb-based" and flags it for the post-cook refinement loop.

## The Reconstructed Recipe

Stored as a `user_recipe` (spec 02 schema) with `source_type = 'encore'`. Additional reconstruction fields ride alongside it:

- Origin context: where and when the dish was eaten, restaurant name if known.
- Confidence map: per-ingredient and per-step confidence.
- Technique notes: inferred methods the model derived from visual evidence ("the char pattern suggests very high heat, short time").
- Open questions: components the model could not resolve, surfaced to the user as taste-check prompts during the first cook ("when you taste the sauce, tell me if it's closer to cumin or caraway — I'll update the recipe").

## The First Cook — Refinement Loop

The first cooking session of a recreated dish is where the reconstruction converges:

- Mira loads the recipe with the open questions injected into session context.
- At natural moments (never interrupting flow), Mira asks at most one or two taste-check questions tied to the open questions.
- After the session, the standard post-session workflow (spec 10) additionally writes reconstruction refinements: confirmed components, corrected quantities, resolved open questions.
- The user's overall verdict ("close", "not quite — it was sweeter") updates the recipe and re-ranks the uncertain fields for the next attempt.

After one or two cooks, the reconstruction stabilizes into a normal recipe in the user's library. The origin context is preserved forever — the Food Time Machine (spec 38) can later surface "You first tasted this in Rome, 14 months ago. You've made it 6 times since."

## Style Profile Crossover

If the user has one or more cook style profiles (spec 32), the recreated recipe offers the standard "cook in [name]'s style" adaptation. This is the same adaptation call as spec 32 — no new mechanism. A restaurant dish reconstructed and then run through grandma's style profile is the deepest personalization moment in the product.

## Sourcing and Bela Handoff

The sourcing check (step 5) produces a per-ingredient status. From the recipe view:

- Ingredients marked `nearby` link to the Ground find or map place where they were last sighted.
- One tap on "get what's missing" creates a Bela order pre-filled with the missing ingredients, flowing through the standard Bela order creation (bela/01) with the user's constraint profile attached as always.
- If an ingredient is `hard-to-find`, the gap is recorded as an `ingredient_not_found` memory event (the event kind introduced in spec 35b Design Angle 4) — so a future Ground find for that ingredient triggers the find-to-cooking connection automatically.

## Share Moment

After a successful first cook (user marked the session complete), the app offers a Discovery Card (spec 25 share mechanics): the original plate photo beside the user's home-cooked result, dish name, and "tasted in [city], cooked at home with Brioela." Sharing is one tap, never automatic, and the card contains no location more precise than city level.

## Data Model

Stored in the Brain DO SQLite — reconstructions are private, personal data:

- `encore`: encore_id, user_id, recipe_id (FK to user_recipe), origin_place_id (nullable), origin_city, captured_at, status (reconstructing, draft, refining, stable), photo_refs_discarded (boolean — always true after processing).
- `encore_open_question`: question_id, encore_id, component, question_text, resolved (boolean), resolution_note, resolved_in_session_id.
- `encore_refinement`: refinement_id, encore_id, session_id, field_changed, old_value, new_value, evidence (taste-check answer | user verdict), created_at.

Raw plate photos are processed and discarded — only derived reconstruction data is stored, consistent with the no-raw-media rule in specs 11 and 34.

## API Surface

- `POST /api/encores` — submit photo(s) + optional voice transcript + context; returns encore_id immediately, reconstruction runs async.
- `GET /api/encores/:id` — reconstruction status and draft recipe.
- `POST /api/encores/:id/refine` — post-cook refinement payload from the Mira session workflow.

## Technical Constraints

- Visual analysis and reconstruction use standard structured LLM calls (GPT-4o mini vision extraction for the image pass, text model for reconstruction) — never a live streaming session.
- Draft delivery target: under 30 seconds from submission to draft recipe available. The capture moment itself returns in under 1 second.
- The reconstruction must never silently drop a constraint substitution — every adaptation is annotated and attributed in the recipe view.
- Voice note audio is discarded immediately after transcription. Plate photos are discarded after the visual analysis step.
- Sourcing checks read Ground and map data through the same cached paths as the map — no new query surface against raw `find` rows.

## Tier Placement

Encore is a Chef-tier feature (spec 19). Core and Free users who attempt a recreation see the draft headline and the first three ingredients as a preview, with the Chef upgrade prompt inline. The capture itself always succeeds and is stored — upgrading later unlocks reconstructions already captured. Nothing about this gates scanning (the Third Law, spec 00).

## Privacy

- Reconstructions, refinements, and origin context are private to the user's Brain DO. Never shared, never community data.
- Restaurant identity is stored at the place level from the places database, not raw GPS.
- The share card is generated only on explicit user action and includes city-level location at most.

## Success Metrics

- Capture-to-draft completion rate.
- First-cook rate: percentage of reconstructions that lead to a cooking session within 30 days.
- Refinement convergence: average number of cooks until the user marks a reconstruction "close enough" or stops refining.
- Bela order conversion from sourcing handoff.
- Share card generation rate after first cook.
- Chef-tier conversion rate among users who hit the recreation preview gate.
