# Growth Mirror — Build

Feature **40**. Production paths under `backend/src/agents/brain/_schemas/skill.*.ts`, `growth.recognition.schema.ts`, `backend/src/agents/brain/_handlers/growth-mirror/`, `backend/src/agents/brain/_helpers/growth-mirror/`, `shared/validator/growth-mirror/`, integration hooks in **29** session-end fiber and **12** BrainMaintenanceAgent Pass 4, and **52** recipe-card context assembly. No new DO class. No mobile feature folder — conversational delivery only.

**Depends on:** **04** Brain migrations spine; **05** `memory_event` write path; **29** session end fiber + Mira scene hooks; **12** BrainMaintenanceAgent (Pass 4 slot); **39** `vision_event` + acoustic rows (heat control); **11** vision events (knife work); **08** recipe difficulty metadata; **43** Chef+ entitlement (inherits cooking session gate).  
**Soft depends:** **52** generative grammar recipe-card consumer; **53** Harvest `craft` chapter reader; **21** suppression ladder.  
**Blocks:** **53** optional `craft` chapter richness; **52** demonstrated-skill recipe framing.

---

## Shipped today

| Area | Status |
|---|---|
| `build-guide/40-growth-mirror/` (5 files) | ✓ docs only |
| `brioela-specs/53-growth-mirror.md` | ✓ spec |
| `_records/connections/36-growth-mirror-connections.md` | ✓ ledger |
| `_records/build-order/37-layer-growth-mirror.md` | ✓ ledger |
| `_records/session-log/038-breakthrough-wave-ten-new-features.md` | ✓ session log |
| `memory_event` table (**05**/**04**) | ✓ — no `skill_evidence` writer |
| `sessions` / `session_turns` (**04**) | ✓ — no post-session extraction |
| BrainMaintenanceAgent (**12**) | ✗ — no Pass 4 |
| `skill_trajectory` / `growth_recognition` schemas | ✗ |
| Growth mirror handlers/helpers | ✗ |
| Recipe-confidence context injection (**52**) | ✗ |
| Growth mirror tests | ✗ |

**Zero growth-mirror production code.** `rg 'skill_trajectory|growth_recognition|skill_evidence|GrowthMirror|demonstratedSkill' backend/src shared/ mobile/` — no matches.

---

## File manifest

### Shared validator (**40**)

| File | Role |
|---|---|
| `shared/validator/growth-mirror/skill.dimension.schema.ts` | Shipped seven + agent-extensible string rules |
| `shared/validator/growth-mirror/skill.evidence.payload.schema.ts` | `skill_evidence` `payload_json` Zod |
| `shared/validator/growth-mirror/skill.trajectory.direction.schema.ts` | `improving \| steady \| insufficient_evidence` |
| `shared/validator/growth-mirror/growth.recognition.status.schema.ts` | `candidate \| surfaced \| expired` |
| `shared/validator/growth-mirror/demonstrated.skill.summary.schema.ts` | Recipe-confidence touch output shape |
| `shared/validator/growth-mirror/index.ts` | Barrel |

### Brain SQLite schemas (**40**)

| File | Role |
|---|---|
| `_schemas/skill.trajectory.schema.ts` | `skill_trajectory` table |
| `_schemas/growth.recognition.schema.ts` | `growth_recognition` table |
| `_schemas/index.ts` | Export + migration registration (**04**) |
| `_migrations/*` | Add growth-mirror tables to Brain chain |

### Brain helpers — evidence (**40**)

| File | Role |
|---|---|
| `_helpers/growth-mirror/load.session.evidence.inputs.helper.ts` | `vision_event`, turns, outcome, recipe difficulty |
| `_helpers/growth-mirror/normalize.by.recipe.difficulty.helper.ts` | Mandatory independence/timing normalization |
| `_helpers/growth-mirror/filter.owner.attributed.signals.helper.ts` | Multi-person rule |
| `_helpers/growth-mirror/build.skill.evidence.prompt.helper.ts` | Structured extraction prompt |
| `_helpers/growth-mirror/parse.skill.evidence.response.helper.ts` | Zod parse LLM output |
| `_helpers/growth-mirror/write.skill.evidence.events.helper.ts` | Batch `memory_event` inserts |
| `_helpers/growth-mirror/index.ts` | Barrel |

### Brain handlers — extraction (**40**)

| File | Role |
|---|---|
| `_handlers/growth-mirror/extract.skill.evidence.from.session.handler.ts` | Post-session orchestrator (**29** calls) |
| `_handlers/growth-mirror/index.ts` | Barrel |

### Brain helpers — trajectory (**40**)

| File | Role |
|---|---|
| `_helpers/growth-mirror/count.qualifying.cooking.sessions.helper.ts` | 8-session overall floor |
| `_helpers/growth-mirror/load.skill.evidence.since.helper.ts` | Per-dimension event load |
| `_helpers/growth-mirror/compute.trajectory.direction.helper.ts` | Direction + confidence math |
| `_helpers/growth-mirror/detect.notability.threshold.helper.ts` | Recognition candidate triggers |
| `_helpers/growth-mirror/upsert.skill.trajectory.helper.ts` | `skill_trajectory` writes |
| `_helpers/growth-mirror/expire.stale.recognition.candidates.helper.ts` | 30-day expiry |
| `_helpers/growth-mirror/build.trajectory.update.prompt.helper.ts` | Optional LLM for `latest_note` |

### Brain handlers — maintenance Pass 4 (**40** + **12**)

| File | Role |
|---|---|
| `_handlers/growth-mirror/run.skill.trajectory.update.pass.handler.ts` | Pass 4 orchestrator |
| `_subagents/brain-maintenance/run.maintenance.pass.handler.ts` | **12** — invoke Pass 4 after Pass 3 |

### Brain helpers — recognition (**40**)

| File | Role |
|---|---|
| `_helpers/growth-mirror/check.growth.insight.budget.helper.ts` | Weekly family + 2-week growth caps |
| `_helpers/growth-mirror/enqueue.growth.recognition.candidate.helper.ts` | Insert `growth_recognition` row |
| `_helpers/growth-mirror/pick.recognition.for.moment.helper.ts` | Session end / recipe open selection |
| `_helpers/growth-mirror/surface.growth.recognition.helper.ts` | Headline + evidence bundle for Mira |
| `_helpers/growth-mirror/build.on.demand.skill.answer.helper.ts` | "Am I getting better?" unbudgeted path |
| `_helpers/growth-mirror/record.recognition.dismissal.helper.ts` | Suppression ladder counter (**21**) |
| `_helpers/growth-mirror/mark.recognition.surfaced.helper.ts` | Status + `surfaced_at` update |

### Brain helpers — recipe-confidence touch (**40**)

| File | Role |
|---|---|
| `_helpers/growth-mirror/map.recipe.techniques.to.dimensions.helper.ts` | Recipe metadata → trajectory dims |
| `_helpers/growth-mirror/build.demonstrated.skill.summary.helper.ts` | **52** / Mira context block |
| `_helpers/growth-mirror/classify.recipe.skill.gap.helper.ts` | mastered / one-notch-up / stretch |

### Brain handlers — privacy + Harvest (**40**)

| File | Role |
|---|---|
| `_handlers/growth-mirror/delete.growth.mirror.data.handler.ts` | Category delete for passport |
| `_handlers/growth-mirror/load.craft.chapter.candidate.handler.ts` | **53** strongest arc reader |
| `_handlers/growth-mirror/load.growth.mirror.context.for.mira.handler.ts` | Brain RPC for Mira scene |

### Brain maintenance prompt guard (**12** + **40**)

| File | Role |
|---|---|
| `_subagents/brain-maintenance/brain.maintenance.system.prompt.ts` | **12** — Pass 3 must exclude cooking-skill dimensions (**40** owns) |

### Integration hooks (call sites owned by other features)

| File | Role | Owner |
|---|---|---|
| `backend/src/agents/mira/_handlers/run.session.end.processing.handler.ts` | Call `extractSkillEvidenceFromSession` | **29** |
| `backend/src/agents/mira/_helpers/build-cooking-mira-scene.helper.ts` | Inject recognition candidate if budget allows | **29** |
| `backend/src/agents/brain/_helpers/generative-grammar/build.recipe.card.context.helper.ts` | `demonstratedSkillSummary` block | **52** |
| `backend/src/agents/brain/_handlers/harvest/load.chapter.candidates.handler.ts` | `craft` type from **40** | **53** |

### Tests (**40**)

| File | Role |
|---|---|
| `backend/src/agents/brain/_helpers/growth-mirror/normalize.by.recipe.difficulty.helper.test.ts` | Normalization mandatory |
| `backend/src/agents/brain/_helpers/growth-mirror/check.growth.insight.budget.helper.test.ts` | Weekly + 2-week caps |
| `backend/src/agents/brain/_handlers/growth-mirror/extract.skill.evidence.from.session.handler.test.ts` | Post-session extraction |
| `backend/src/agents/brain/_handlers/growth-mirror/run.skill.trajectory.update.pass.handler.test.ts` | Floors + candidate enqueue |
| `backend/src/agents/brain/_helpers/growth-mirror/build.demonstrated.skill.summary.helper.test.ts` | Recipe-confidence touch |

---

## Acceptance criteria

### Post-session extraction

- [ ] Cooking session end fiber calls `extractSkillEvidenceFromSession` after outcome_summary (**29**).
- [ ] Writes `memory_event` rows with `kind: skill_evidence` only when concrete evidence refs exist.
- [ ] Independence/timing signals include `recipe_difficulty` normalization — un-normalized signals rejected.
- [ ] Multi-person session: guest actions produce zero evidence rows.
- [ ] Reads `vision_event` for session when table exists (**39**); degrades gracefully when absent.

### Trajectory maintenance (Pass 4)

- [ ] BrainMaintenanceAgent runs Pass 4 after Pass 3 on `brain_maintenance_run` (**12**).
- [ ] No trajectory row updated until 8 qualifying cooking sessions exist.
- [ ] Per-dimension `insufficient_evidence` until 5 `skill_evidence` events for that dimension.
- [ ] `evidence_refs_json` on every `skill_trajectory` row traces to real `memory_event` ids.
- [ ] Notability threshold creates `growth_recognition` candidate with evidenced headline.
- [ ] Candidates older than 30 days without surfacing → `expired`.

### Recognition delivery

- [ ] Max one volunteered growth recognition per two weeks per user.
- [ ] Shared weekly insight budget with **35**/**38** — never two insight types same calendar week.
- [ ] On-demand "am I getting better?" bypasses budget; includes honest stagnant dimensions when asked.
- [ ] Never push notification (**21**); never standalone card UI.
- [ ] Two dismissals trigger suppression ladder.
- [ ] Generic praise strings rejected by validation.

### Recipe-confidence touch

- [ ] `buildDemonstratedSkillSummary` injected into recipe-card context path (**52**).
- [ ] Mastered techniques → `familiar` skill energy (no beginner warnings).
- [ ] One-notch-up → Mira pre-brief includes attention step.
- [ ] No visible skill level UI element anywhere.

### Boundaries

- [ ] Pass 3 trait inference (**12**) does not create cooking-skill personality traits.
- [ ] No writes to `skills` table (**06**) from **40** paths.
- [ ] No writes to `cook_style_profile` (**32**) from **40** paths.
- [ ] Harvest `craft` chapter works when **40** absent (optional input).

### Privacy

- [ ] Category delete removes `skill_trajectory`, `growth_recognition`, and user-requested `skill_evidence`.
- [ ] Growth data excluded from Ground/Mesa/community exports.

### Tier

- [ ] Feature inactive below Chef tier (no cooking sessions = no evidence).

---

## Ledger / numbering notes

| Ledger | Feature folder | Note |
|---|---|---|
| `_records/build-order/37-layer-growth-mirror.md` | `_features/40-growth-mirror/` | Layer 37 ≠ feature 40 (same pattern as acoustic 30 vs 39) |
| `build-guide/40-growth-mirror/` | `_features/40-growth-mirror/` | Build-guide number matches feature number |

**Obsolete / reconcile:**

- `build-guide/05-brain/04-sub-agents.md` Pass 3 "memory consolidation flags" — superseded by spec **15** trait inference (**12** spec is authoritative).
- `implementable-specs/01-memory-event.md` event types list — add `skill_evidence` when implementing (no SQL enum; free-text kind).

**Trait inference duplication guard:** Document in **12** `brain.maintenance.system.prompt.ts` that cooking-skill dimensions are owned by **40** Pass 4 — Pass 3 must not infer them into `user_personality`.
