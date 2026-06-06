# Mesa — Tools

## What This File Covers

AI-callable tools for Mesa. Tools live under `tools/mesa/` and are the only way the agent writes or reads structured Mesa state.

---

## Tool Placement

Actual code later:

```text
tools/mesa/
  create-mesa.ts
  add-mesa-member.ts
  update-mesa-member.ts
  archive-mesa-member.ts
  add-mesa-constraint.ts
  update-mesa-constraint.ts
  set-food-audience.ts
  evaluate-mesa-compatibility.ts
  create-mesa-invite.ts
  accept-mesa-contribution.ts
  propose-potential-member.ts
  dismiss-potential-member.ts
```

Exports still go through `tools/index.ts` only.

---

## Core Tools

| Tool | Purpose | Writes |
|---|---|---|
| `create_mesa` | create owner's Mesa | `mesa` |
| `add_mesa_member` | add person to Mesa | `mesa_member` |
| `update_mesa_member` | update label/role/age band | `mesa_member` |
| `archive_mesa_member` | remove from active Mesa | `mesa_member.status` |
| `add_mesa_constraint` | add constraint to member | `mesa_constraint` |
| `update_mesa_constraint` | change/deactivate member constraint | `mesa_constraint` |
| `set_food_audience` | set current audience | `mesa_food_audience` |
| `evaluate_mesa_compatibility` | evaluate product/recipe/menu for audience | read-only |
| `create_mesa_invite` | invite contributor | `mesa_invite` |
| `accept_mesa_contribution` | accept contributed event | `mesa_contribution_event` |
| `propose_potential_member` | save inferred candidate | `mesa_potential_member` |
| `dismiss_potential_member` | suppress bad candidate | `mesa_potential_member.status` |

---

## Permission Pattern

Mesa tools are available to:

- chat sessions
- cooking sessions
- scan flows through backend/internal calls
- ambient pattern review for candidates only

Potential-member tools cannot create active members. They can only create candidates. Owner confirmation is required for active members.

---

## Example Tool Input

```typescript
type AddMesaMemberInput = {
  mesaId: string
  label: string
  role: "self" | "partner" | "child" | "elder" | "guest" | "caregiver" | "other"
  ageBand?: "child_5_7" | "child_8_10" | "child_11_12" | "teen" | "adult" | "elder"
  confirmationText: string
}
```

```typescript
type AddMesaConstraintInput = {
  mesaId: string
  memberId: string
  constraintType: "hard_allergy" | "intolerance" | "dietary_identity" | "dislike" | "medical_watchlist" | "boycott"
  entityKind: "ingredient" | "category" | "brand" | "condition" | "other"
  entityValue: string
  severity: "hard" | "soft"
  source: "owner_stated" | "member_stated" | "imported" | "inferred_candidate"
  confirmedByOwner: boolean
}
```

Hard constraints require `confirmedByOwner = true` before use.

---

## No Direct SQLite Writes

LLM layer never writes Mesa tables directly.

Every Mesa mutation happens through a Zod-validated tool. This keeps multi-person safety changes auditable.
