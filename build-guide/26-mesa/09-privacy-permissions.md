# Mesa — Privacy And Permissions

## What This File Covers

Mesa's privacy rules, child restrictions, medical/wearable boundaries, invited contributor permissions, deletion, and export.

---

## Privacy Rule

Mesa is private by default.

No Mesa data goes to public/community surfaces unless a separate feature explicitly asks and passes its own privacy gate.

---

## Child Restrictions

Child members do not imply child accounts.

Children cannot:

- edit constraints
- invite contributors
- share externally
- publish Ground finds
- make purchases
- view adult health data
- change subscription/settings

Kids Mode co-scan remains supervised and parent-controlled.

---

## Medical Conditions

Medical condition data is member-specific and sensitive.

Rules:

- do not expose one member's medical profile to invited contributors by default
- do not show exact condition names in shared cards by default
- do not publish Mesa medical data to Ground/map/menu/product tables
- owner confirmation required for member medical constraints

---

## Wearables

Wearable/glucose data is never shared into Mesa by default.

If Mesa ever supports wearable sharing, it requires separate explicit opt-in per member/account.

---

## Permissions

```typescript
type MesaPermission =
  | "view_mesa_summary"
  | "contribute_scans"
  | "contribute_pantry"
  | "suggest_constraints"
  | "edit_members"
  | "edit_constraints"
  | "invite_members"
```

- owner has all permissions
- invited adults can contribute scans/pantry if granted
- invited adults can suggest constraints, but cannot activate hard constraints by default
- children have no account-level permissions

Owner confirmation is required for any safety-critical member change.

---

## Deletion

Owner can:

- archive member
- delete member constraints
- delete Mesa contribution events
- archive entire Mesa

Contributor can:

- stop contributing
- request removal of their contributed events where ownership applies

Accepted shared object contributions belong to Mesa continuity after acceptance. Personal/member facts belong to the person or member they describe and should be removable/archiveable when that person leaves or revokes permission.

---

## Export

Mesa export should be explicit.

Default account export should not include sensitive member details unless user selects Mesa export.

Mesa export should label:

- owner-created data
- contributor-created data
- member constraints
- compatibility events
- contribution ownership: Mesa-owned shared object vs person/member fact

Do not include private data from linked contributor accounts.
