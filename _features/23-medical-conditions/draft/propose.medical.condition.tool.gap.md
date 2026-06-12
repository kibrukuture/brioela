# Draft: propose_medical_condition tool (gap — not implemented)

Target: `backend/src/agents/brain/_tools/propose.medical.condition.tool.ts` + split siblings

Source: `build-guide/22-medical-conditions/01-condition-detection-confirmation.md`, pattern from **07** `propose_user_constraint`

---

## Intended behavior

**Purpose:** Insert `medical_condition_candidates` row with `status = 'pending_confirmation'`. Does **not** activate food rules.

**When:** Behavioral inference from `memory_event` evidence OR direct user statement pending confirmation flow.

**When NOT:** Active profile already exists for same `conditionType`; duplicate pending candidate exists.

### Input schema

| Field | Required | Notes |
|---|---|---|
| `condition_type` | yes | `MedicalConditionType` enum |
| `detected_from` | yes | `voice` \| `chat` \| `scan_comment` \| `recipe_session` |
| `source_session_id` | no | UUID |
| `evidence_text` | yes | Minimal quote, max 500 chars |
| `confidence` | yes | 0–1 snapshot |
| `evidence` | yes | `memory_event` IDs — min 1 |

### Direct user statement flow

When user says "I have celiac" explicitly: propose candidate, then **immediately** call `confirm_medical_condition` in same chat turn with `outcome: 'confirmed'` — mirror **07** hard-allergy fast path.

### Returns

```json
{ "id": "...", "condition_type": "celiac", "status": "pending_confirmation", "confidence": 0.95 }
```

### Permissions

| Tool | chat | cooking | alarm | brain_maintenance |
|---|---|---|---|---|
| `propose_medical_condition` | ✓ | ✓ | ✗ | ✗ |
