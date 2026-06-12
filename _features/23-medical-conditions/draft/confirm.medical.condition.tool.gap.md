# Draft: confirm_medical_condition tool (gap — not implemented)

Target: `backend/src/agents/brain/_tools/confirm.medical.condition.tool.ts` + split siblings

Source: `build-guide/22-medical-conditions/01-condition-detection-confirmation.md`, pattern from **07** `confirm_user_constraint`

---

## Intended behavior

**Purpose:** Resolve candidate → active `medical_condition_profiles` row OR deactivate/reject.

### Input schema

| Field | Required | Notes |
|---|---|---|
| `candidate_id` | conditional | Required when confirming new detection |
| `profile_id` | conditional | Required when deactivating existing |
| `outcome` | yes | `confirmed` \| `dismissed` \| `deactivated` |
| `strictness` | conditional | Required on `confirmed` when condition supports strict/moderate (gout, IBS) |
| `confirmed_by` | yes | `self_voice` \| `self_chat` \| `settings` |

### On `confirmed`

1. Mark candidate `status = 'confirmed'`
2. Insert `medical_condition_profiles` with `status = 'active'`, `ruleVersion` = current active version from config service
3. Optional: sync `user_memory.health.conditions` mirror for prompt injection
4. Log private audit event

### On `deactivated`

Mark profile `inactive`, set `deactivatedAt`, stop rule application — do not delete unless user requests full deletion.

### Confirmation copy requirements (agent-enforced)

- Condition name + what changes in app
- Food guidance, not medical advice
- Explicit yes/no

### Permissions

| Tool | chat | cooking | alarm | brain_maintenance |
|---|---|---|---|---|
| `confirm_medical_condition` | ✓ | ✗ | ✗ | ✗ |

**Cooking propose → chat confirm handoff:** Same gap as **07** — Mira cooking must route confirm to chat path.
