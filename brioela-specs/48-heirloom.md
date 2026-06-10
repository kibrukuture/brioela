# 48. Heirloom

## Goal

Let the irreplaceable things a user captures — generational recipes (spec 13), cook style profiles (spec 32), session photos and stories — be passed to family members as a deliberate, consent-based inheritance. Grandma's cooking should not live and die inside one account.

## Naming

**Heirloom** is the product name — and it is an umbrella over the whole heritage family, not just this spec. Early drafts called this spec "Food Inheritance" and the artifact a "Family Cookbook"; both phrases are retired as names.

- **What it names**: the artifact (the curated bundle is "an Heirloom"), the act of passing it on, and the heritage feature family as a whole:
  - spec 13 (Generational Recipe Capture) — capturing an Heirloom recipe
  - spec 32 (Grandma Style Flavor Profile) — the cook's Heirloom style profile
  - spec 48 (this spec) — assembling and passing the Heirloom on
- **Why this word**: an heirloom is an inherited treasured object, and the word is already food-native with only warm associations — heirloom tomatoes, heirloom recipes is a phrase people say unprompted. One name gives the three specs one emotional storyline: capture it, cook with it, pass it down. Reclaimed-word family (Ground, Find, Passport, Tonight). Note the article: **an** Heirloom (silent h).
- **Where it is used**:
  - UI surfaces: the Heirloom section of the recipe library, the assembly and invitation flows, the recipient landing ("[Name]'s Heirloom"), succession in the deletion flow.
  - Code namespace: `heirloom` — tables `heirloom`, `heirloom_item`, `heirloom_invitation`, `heirloom_succession`; API `/api/heirlooms`; future tool code under `tools/heirloom/`.
  - Docs: this spec, `build-guide/35-heirloom/`, and all records use Heirloom. Specs 13 and 32 keep their existing internal table names (`heritage_recipe_capture`, `cook_style_profile`) — those predate the name and remain valid; user-facing language across all three specs says Heirloom.

## Why This Exists

Spec 32 states the emotional thesis plainly: "When she is gone, her cooking lives in the app. That is not a feature. That is a reason to never delete the app." But today that legacy lives in exactly one account — the account of whoever happened to run the capture session. If that user churns, loses access, or dies, the family's recipes die with them. The spec already treats style profiles as irreplaceable (30-day deletion grace period with a hard warning); inheritance is the natural completion of that protection.

This is also a growth loop with unusual gravity: one grandma session can bring an entire family into Brioela, each member receiving something with real personal value on day one — the strongest possible first-session experience (spec 00's "can't live without it" moment, delivered before the first scan).

## User Outcome

- A user who owns captured heritage content bundles it into an **Heirloom**: selected heritage recipes, the cook's style profile, session photos, and short written context ("she always made this for Meskel").
- They designate recipients — family members, by invitation. Recipients accept and receive the Heirloom into their own Brain, whether they were Brioela users before or not.
- Each recipient now owns their copy: the recipes appear in their library attributed to the cook, "cook in [name]'s style" (spec 32) works in their sessions, and the Food Time Machine (spec 38) weaves the heritage into their own history.
- The owner can also set the Heirloom to transfer on account deletion or designate a successor — so churn or death does not erase the family's food memory.
- Updates flow forward by choice: when the owner captures a new session with grandma, they can push the new recipe to existing Heirloom recipients with one tap.

## In Scope

- Heirloom assembly from heritage content the user owns: `heritage_recipe_capture` drafts and finalized recipes (spec 13), `cook_style_profile` and attributes (spec 32), session photos already attached to those records, owner-written context notes.
- Invitation and acceptance flow (link or QR — usable by non-users, who land on the standard onboarding with the Heirloom waiting).
- Copy-on-accept delivery into each recipient's Brain DO.
- Succession: transfer-on-deletion designation and explicit successor handoff.
- Push-forward of new additions to prior recipients (always explicit, per addition).

## Out of Scope

- Public publishing, marketplace, or discovery of heritage recipes. An Heirloom moves along explicit invitations only — it is family infrastructure, not content (the spec 35 no-social design law applies).
- Voice cloning or audio playback of the captured cook. Session audio handling stays exactly as specced (cooking-session/07); inheritance carries recipes, style, photos, and words — not voices.
- Multi-party live editing of a shared Heirloom. Each recipient owns an independent copy; there is no shared mutable object to fight over.
- Inheritance of anything outside heritage content: scan history, memory, health data, personality — none of it is inheritable, ever.

## The Heirloom Object

An Heirloom is an assembled, versioned bundle:

- **Cover**: cook's name, relationship, optional photo, owner's dedication text.
- **Recipes**: finalized heritage recipes (spec 13 schema), each with its uncertainty markers, source session reference, and any owner annotations.
- **Style profile**: the cook's `cook_style_profile` summary and attributes (spec 32), so "cook in her style" works for every recipient.
- **Moments**: session photos and owner-written stories attached per recipe.

The owner curates explicitly — nothing is included by default. Assembly is voice-first like everything else: "add the doro wat and the bread, and write that she made the bread every Sunday" works as a complete instruction.

## Delivery Model: Copy, Not Share

On acceptance, the recipient's Brain DO receives an independent copy. This follows the existing multi-participant precedent exactly — spec 12 already writes session outcomes "to each participant's Brain DO individually... they each own their own copy of what was learned."

Consequences, by design:
- The owner deleting their account later does not claw back delivered copies. Inheritance is a gift, not a license.
- A recipient can annotate, adapt (spec 32 recipe variants), or delete their copy without touching anyone else's.
- There is no central shared object whose ownership must be litigated. The `Heirloom_edition` record in Supabase carries only routing metadata (who was invited, what version, acceptance state) — the content travels DO-to-DO at acceptance and the transfer payload is not retained outside the DOs.

## Succession

Two mechanisms, both explicit:

1. **Successor designation**: the owner names a successor (an accepted recipient). If the owner deletes their account, the deletion flow (which already warns about style profile loss, spec 32) offers the transfer: the successor inherits the owner-role for the Heirloom — the ability to push future... nothing new can be captured from a deleted account, so in practice the successor becomes the keeper who can re-share the Heirloom onward to new family members.
2. **Dormancy handoff**: if the owner's account is deleted without designation, any already-delivered copies simply persist (copy model). Nothing transfers automatically. Brioela never infers death and never moves content without a prior explicit instruction.

## Onboarding Through Inheritance

A non-user receiving an invitation hits a dedicated landing: the Heirloom cover, the cook's name, who invited them. Accepting requires the standard account creation (Apple/Google sign-in only, spec 21) and nothing else — no questions, no setup. Their first app experience is opening grandma's Heirloom, not scanning a product. The spec 21 cold-start rules apply afterward as normal.

This entry path must be measured separately (see metrics) — it is hypothesized to be the highest-retention acquisition channel in the product.

## Data Model

In the owner's and each recipient's Brain DO SQLite (private):

- `heirloom`: heirloom_id, role (owner | keeper | recipient), cook_name, cook_relationship, dedication_text, cover_photo_ref, version, created_at, received_from (nullable), updated_at.
- `heirloom_item`: heirloom_id, item_type (recipe | style_profile | moment), local_ref (recipe_id / profile_id / photo ref), owner_note, added_at, version_added.

In Supabase Postgres (shared routing metadata only — no content):

- `heirloom_invitation`: invitation_id, heirloom_id, owner_user_id, invitee_contact_hash, status (sent | accepted | declined | expired), version_at_invite, created_at, responded_at.
- `heirloom_succession`: heirloom_id, owner_user_id, successor_user_id, designated_at, executed_at (nullable).

## API Surface

- `POST /api/heirlooms` — assemble an Heirloom from owned heritage content.
- `POST /api/heirlooms/:id/invitations` — invite recipients; returns share link/QR.
- `POST /api/heirlooms/invitations/:id/accept` — triggers the DO-to-DO copy delivery.
- `POST /api/heirlooms/:id/push` — push a new item to prior recipients (each receives an accept prompt; nothing lands silently).
- `POST /api/heirlooms/:id/successor` — designate or change the successor.

## Technical Constraints

- Content transfer is a DO-to-DO flow brokered by a Worker route: owner's Brain assembles the payload, recipient's Brain ingests it through the standard write paths (recipes via the spec 02/13 schema, style profile via spec 32 tables). The broker holds the payload transiently only; nothing is persisted outside the two DOs.
- Photos referenced by moments are copied into recipient-scoped Cloudflare R2 objects at acceptance — recipients must not depend on the owner's objects surviving.
- Versioning is append-only: a pushed addition creates version N+1; recipients on older versions are simply offered the delta. No retroactive removal propagates — copies are copies.
- Invitation links expire (30 days) and are single-recipient. The invitee contact is stored hashed, used only for matching at acceptance.

## Tier Placement

Receiving an inheritance is **free, always** — it is an acquisition surface and an emotional commitment the product must honor unconditionally. Assembling and sending Heirlooms is Chef tier (spec 19), consistent with generational recipe capture already being a Chef feature. Succession designation comes with Heirloom ownership at no extra gate.

## Privacy

- Only heritage content explicitly curated by the owner ever moves. The assembly UI shows exactly what a recipient will receive, item by item, before any invitation is sent.
- The captured cook is a person too: the capture consent obtained at session time (spec 13 flow) covers family preservation; the Heirloom dedication screen reminds the owner that the cook's recipes and style are being shared and to whom. If the cook is a living Brioela user, their own captures remain their own — inheritance only moves content the owner's sessions produced.
- Invitation metadata in Supabase carries no recipe content and no health-adjacent data of any kind.
- Recipient copies appear in each recipient's "what Brioela knows about me" content inventory and are individually deletable.

## Success Metrics

- Heirlooms assembled per user with heritage captures (is the capture → Heirloom step natural?).
- Invitation acceptance rate, split by existing users vs. new users.
- New-user activation and 90-day retention for inheritance-entry users vs. scan-entry users (the channel hypothesis).
- "Cook in their style" usage rate among recipients (is the inheritance used, not just stored?).
- Push-forward acceptance rate for new additions.
- Churn delta for Heirloom owners and recipients vs. matched baseline (the spec 32 irreplaceability hypothesis, now measurable across a family).
