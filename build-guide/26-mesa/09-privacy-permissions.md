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

If future Mesa support allows it, it requires separate explicit opt-in per member/account.

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

V1 recommendation:

- owner has all permissions
- invited adults can contribute scans/pantry if granted
- invited adults cannot edit hard constraints by default
- children have no account-level permissions

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

Open decision: exact export/deletion ownership for accepted contributor events.

---

## Export

Mesa export should be explicit.

Default account export should not include sensitive member details unless user selects Mesa export.

Mesa export should label:

- owner-created data
- contributor-created data
- member constraints
- compatibility events

Do not include private data from linked contributor accounts.
