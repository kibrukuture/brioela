# Mesa — Shared Enrichment And Invites

## What This File Covers

How another Brioela account can contribute selected food events to Mesa without exposing their private memory.

---

## Core Rule

Invited contributors share selected events, not their whole Brioela brain.

Mesa enrichment is scoped, permissioned, and reversible.

Invited adults contribute observations and suggestions. The Mesa owner remains the authority for members, constraints, and safety-critical changes.

---

## Invite Roles

```typescript
type MesaInviteRole = "adult_member" | "caregiver" | "guest_contributor"

type MesaContributionScope =
  | "scan_results"
  | "confirmed_purchases"
  | "pantry_items"
  | "meal_feedback"
  | "recipe_feedback"
```

---

## Invite Flow

1. Owner says: "Invite my partner to Mesa so their grocery scans can help."
2. Brioela explains the scope.
3. Owner confirms.
4. Invitee accepts from their own account.
5. Invitee chooses what they contribute.
6. Contributions flow as selected events only.

No hidden syncing.

---

## Contribution Examples

Allowed:

- "Partner scanned this snack and marked it bought for Mesa."
- "Caregiver added this pantry item."
- "Adult member said this recipe worked for dinner."

Blocked by default:

- private personal constraints
- medical conditions
- wearable/glucose data
- full scan history
- private notes
- location trails

---

## Acceptance Rules

Some contributions can auto-apply if owner allowed scope. Sensitive contributions should queue for owner acceptance.

Auto-apply candidates:

- pantry item from trusted adult member
- product scanned and marked as bought for Mesa

Owner-review candidates:

- new member constraint
- medical/health-related note
- deletion of shared pantry item
- changing food audience defaults

Invited adults cannot activate hard constraints by default. If an invited adult says:

```text
Noah is also allergic to cashews.
```

Brioela queues:

```text
Alex suggested adding cashew as a hard allergy for Noah. Confirm before I use this for Mesa?
```

The rule becomes active only after owner confirmation.

---

## Revocation

Owner can revoke invite. Contributor can leave.

On revoke:

- stop future contribution
- keep existing accepted Mesa data unless owner deletes it
- remove contributor access to Mesa state
- keep audit log privately

---

## Data Ownership

Mesa separates three kinds of data.

Shared object contributions become Mesa data after acceptance:

- pantry items
- grocery purchases
- scanned products marked for Mesa
- recipe worked/did-not-work feedback

Personal/member facts belong to the person/member they describe:

- allergy
- medical condition
- dietary identity
- dislike
- private preference

Private account data never becomes Mesa data unless explicitly contributed:

- full scan history
- private notes
- wearable/glucose data
- personal food memory

Contributor leaving Mesa stops future sharing. Accepted shared objects may remain with Mesa. Personal/member facts contributed by that person should be removed or archived unless the owner independently confirms a non-sensitive reason to keep them.

---

## Copy

Use:

```text
Let Alex contribute grocery scans to Mesa?
They will not share their private Brioela memory.
```

```text
Leaving Mesa stops future sharing. Shared pantry items you added may remain with Mesa, but personal food needs you shared can be removed.
```

Avoid:

```text
Sync Alex's account with yours.
```
