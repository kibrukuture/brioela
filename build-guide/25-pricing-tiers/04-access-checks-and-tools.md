# Pricing Tiers — Access Checks And Tools

## What This File Covers

Entitlement data model, server-side checks, client hints, and the `check-tier-access` tool boundary.

---

## Core Rule

Entitlements are enforced server-side.

Client-side checks can improve UI, but cannot be trusted for access.

---

## Tier Enum

```typescript
type BrioelaTier = "sapor" | "luma" | "culina" | "viva" | "signet"
```

Mesa is not a normal tier yet. Treat it as an add-on entitlement until product decisions are final.

```typescript
type BrioelaAddon = "mesa" | "session_credits" | "bela_service"
```

---

## Entitlement Shape

```typescript
type UserEntitlement = {
  userId: string
  tier: BrioelaTier
  addons: BrioelaAddon[]
  billingStatus: "free" | "trialing" | "active" | "past_due" | "cancelled" | "expired"
  currentPeriodEndsAt: number | null
}
```

Tier state should be available from auth/session profile and mirrored into Orchestrator context where needed.

---

## Access Check

```typescript
type FeatureAction =
  | "recipe_import_unlimited"
  | "receipt_scan"
  | "menu_scan"
  | "kids_mode"
  | "voice_cooking_session"
  | "live_video_cooking"
  | "multi_person_room"
  | "advanced_behavior_reports"
  | "mesa_audience"
  | "verified_profile"
  | "verified_business"

type TierAccessResult = {
  allowed: boolean
  requiredTier: BrioelaTier | null
  requiredAddon: BrioelaAddon | null
  reason: "allowed" | "requires_upgrade" | "usage_limit_reached" | "billing_inactive"
  upgradeTarget: BrioelaTier | BrioelaAddon | null
}
```

---

## Tool

Under `tools/pricing/` later:

```text
check-tier-access.ts
```

All exports still go through `tools/index.ts`.

Tool responsibility:

- read entitlement state
- evaluate feature action
- return allowed/upgrade target
- never perform billing mutation

Billing changes happen through subscription management endpoints, not LLM-callable tools.

---

## Server-Side Enforcement

Features must call access checks before expensive or gated work:

- recipe import beyond Sapor limit
- receipt scan
- menu scan
- Kids Mode explanation
- voice cooking session
- live video session
- multi-person room
- advanced behavior reports
- Mesa audience evaluation after Mesa ships
- Signet profile tools

Features must not call access check before free basic product scan.

---

## Billing Failure

If billing is inactive:

- keep Sapor access
- preserve data
- prevent new gated sessions/actions
- show gentle billing update prompt
- do not delete user memory

Cancellation should downgrade future access, not punish existing private history.
