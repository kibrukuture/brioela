# 41. Mesa

## Goal

Let Brioela evaluate food for more than one person without forcing every decision into a single-user profile. Mesa is the multi-person food intelligence layer: product scans, recipes, restaurant menus, grocery planning, Bela orders, and cooking sessions can answer "who is this for?" and "does this work for everyone at the table?"

## Why This Exists

Many food decisions are not individual. A parent may shop for five people. A caregiver may manage food for an elder. A partner may scan groceries for the whole home. A friend may cook for recurring guests. One person's Brioela account can be useful, but the real decision is often group compatibility.

Mesa turns Brioela from a personal food assistant into a multi-person food compatibility engine.

The product question changes from:

```text
Is this good for me?
```

to:

```text
Who can eat this, who should avoid it, and what works for everyone at this table?
```

## Naming

The product name is **Mesa**.

Do not call this "Family Account" or "Household" in user-facing product language. Mesa is broader:

- parent and children
- partner/spouse
- grandparents/elders
- roommates
- recurring guests
- caregivers
- dinner groups

Mesa means the table. It is the food audience layer.

## User Outcome

- User scans a product and sees whether it works for self, kids, partner, elder, or selected Mesa members.
- User plans dinner and Brioela filters recipes against everyone eating.
- User scans a restaurant menu and sees dishes that work for the whole Mesa.
- User builds a Bela order and substitutions respect Mesa compatibility.
- Another invited account can contribute scans or food events back to the shared Mesa context when permissioned.
- Nobody has to rebuild the same food constraints from scratch if a trusted Mesa owner has already configured them.

## Core Concepts

### Food Audience

Every food decision can have an audience:

```typescript
type FoodAudience = {
  mode: "just_me" | "mesa" | "selected_members" | "guest_session"
  memberIds: string[]
}
```

### Mesa Member

Mesa members are lightweight food profiles, not necessarily full Brioela accounts.

```typescript
type MesaMember = {
  memberId: string
  mesaId: string
  label: string
  role: "self" | "partner" | "child" | "elder" | "guest" | "caregiver" | "other"
  ageBand: "child_5_7" | "child_8_10" | "child_11_12" | "teen" | "adult" | "elder" | null
  status: "active" | "archived"
}
```

### Mesa Constraint

Constraints attach to a member.

```typescript
type MesaConstraint = {
  constraintId: string
  memberId: string
  constraintType: "hard_allergy" | "intolerance" | "dietary_identity" | "dislike" | "medical_watchlist" | "boycott"
  entityKind: "ingredient" | "category" | "brand" | "condition" | "other"
  entityValue: string
  severity: "hard" | "soft"
  confirmedByOwner: boolean
  source: "owner_stated" | "member_stated" | "imported" | "inferred_candidate"
}
```

## Account Model

Mesa should not start as full multi-account auth.

Recommended phases:

1. **Owner-managed Mesa:** one Brioela account manages multiple Mesa members locally/private to that owner.
2. **Invited contributor:** another Brioela account can accept a Mesa invite and contribute selected scans/events back to the shared Mesa context.
3. **Full shared Mesa:** multiple accounts can participate with role-based permissions and shared planning.

Start with phase 1. Do not block the feature on complex family account permissions.

## Permission Model

Mesa requires strict roles.

```typescript
type MesaRole = "owner" | "adult_member" | "caregiver" | "child_view" | "guest_contributor"
```

Owner can:

- create members
- edit constraints
- choose active audience
- invite contributors
- remove members
- decide what shared signals count

Adult member can, if invited:

- scan for Mesa
- contribute accepted scans/events
- view Mesa-safe recommendations depending on permission

Child view can:

- scan in supervised Kids Mode
- hear kid-safe explanations

Child view cannot:

- edit constraints
- share externally
- publish community notes
- make purchases
- invite people
- view adult health data

## Shared Enrichment

Mesa becomes powerful when trusted members can enrich the shared food context.

Example:

- Mom creates Mesa for a family of five.
- Partner creates their own Brioela account.
- Mom invites partner to Mesa.
- Partner scans a snack while shopping.
- Brioela evaluates it against Mesa.
- If partner confirms purchase/eating intent, that scan can enrich shared Mesa pantry/history.
- Partner's private Brioela memory remains private unless explicitly shared.

Shared enrichment must be explicit and scoped. It should not copy a person's entire private food brain into Mesa.

## Feature Impact

Product scan:

- show per-member compatibility
- show "works for everyone" when true
- show "avoid for [member label]" for hard conflicts

Menu scanning:

- find dishes that work for everyone at the table
- show member-specific warnings

Recipe ingestion:

- mark whether imported recipe works for selected Mesa audience
- suggest substitutions per member constraints

Meal planning:

- generate meals for selected Mesa audience
- account for kids, elders, guest constraints, budget, and pantry

Bela:

- substitutions must work for the active Mesa audience
- shopper scanner can show "not OK for Mesa" instead of only "not OK for user"

Kids Mode:

- co-scan remains parent-supervised
- future Mesa can provide child-specific constraints only if owner created them

Ground/community:

- Mesa data never publishes publicly by default
- public contributions still go through Ground gate and privacy rules

## Data Boundary

Mesa data is private by default.

Never share:

- child identity
- member medical condition data
- per-member allergy profile
- individual scan history from invited accounts without explicit permission
- private wearable/health data

Allowed with permission:

- shared pantry item
- shared scan result summary
- shared meal plan
- shared grocery list
- shared compatibility result

## Tiering

Mesa is an upgrade-tier feature.

Scanning for the signed-in user remains free. Safety for the signed-in user remains free. Mesa adds multi-person evaluation, shared grocery planning, shared compatibility, and invited-member enrichment, which can be gated by a higher tier.

Pricing mechanics live in `25-pricing-tiers`.

## Open Product Questions

- Is Mesa owner-managed only at launch, or should invited contributors ship early?
- Should Mesa live under Core, Chef, Power, or a separate paid add-on?
- How many members are included per tier?
- Should child members ever become full accounts later?
- How should data export/deletion work if invited adults contribute to Mesa?

These questions should be resolved before implementation beyond overview planning.

## Success Metrics

- Mesa creation rate among users with kids/household signals.
- Scan audience selection rate.
- Product scan compatibility actions: works-for-all, avoid-for-member, substitution accepted.
- Meal plan generation for Mesa audience.
- Invite acceptance rate if contributor mode ships.
- Retention difference for Mesa users vs single-profile users.
