# Mesa — Shared Enrichment And Invites

## What This File Covers

How another Brioela account can contribute selected food events to Mesa without exposing their private memory.

---

## Core Rule

Invited contributors share selected events, not their whole Brioela brain.

Mesa enrichment is scoped, permissioned, and reversible.

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

---

## Revocation

Owner can revoke invite. Contributor can leave.

On revoke:

- stop future contribution
- keep existing accepted Mesa data unless owner deletes it
- remove contributor access to Mesa state
- keep audit log privately

---

## Copy

Use:

```text
Let Alex contribute grocery scans to Mesa?
They will not share their private Brioela memory.
```

Avoid:

```text
Sync Alex's account with yours.
```
