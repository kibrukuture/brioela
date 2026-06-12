# Platform Auth + Onboarding — Spec

Feature **03**. Supabase authentication (mobile client + backend JWT validation), session lifecycle, route gating, device biometric lock, user profile bootstrap in Postgres, and first-run onboarding contract. Brain DO addressing keys off Supabase `user.id`. Tier entitlements are read at action gates (**43**), not at auth boot.

---

## Purpose

Auth + onboarding owns what must exist before product features can identify a user:

1. **Identity provider** — Supabase Auth only. No Clerk, no custom JWT issuer, no second user-id strategy.
2. **Mobile session** — Encrypted session storage, token refresh, auth Zustand store, API client Bearer + `userId` query param.
3. **Backend gate** — Hono auth middleware: validate Supabase access token, match `userId` query param, attach `user` to context.
4. **Route protection** — `AppGate` boot init, protected tab redirect, sign-out → `/onboarding`.
5. **Device security** — Local biometric/passcode lock overlay and sensitive-action gates (not account auth).
6. **Profile bootstrap** — Postgres `brioela.users` row on Supabase sign-up via DB trigger.
7. **Onboarding contract** — Camera-first, max two questions, deferred permanent account creation, permission-on-action sequencing.
8. **Brain binding** — Stable Supabase `user.id` (anonymous or linked) → `BRIOELA_BRAIN.idFromName(userId)`.

This is **not** design tokens (**02**), Brain session open/close (**11**), live chat runtime (**20**), or tier matrix implementation (**43**). It is the identity attach point for all of them.

---

## Architecture

```text
Mobile (Expo)
  │
  ├── supabase-js client (encrypted storage, autoRefresh)
  ├── useAuthStore (user, session, initializeAuth, signOut)
  ├── AppGate → AppLockOverlay → Expo Router
  └── apiClient (Bearer + userId query)
        │
        ▼ HTTPS
Backend Hono (01)
  ├── authMiddleware (skip list for webhooks, health, /v1/auth/*)
  ├── getSupabaseAdmin().auth.getUser(token)
  └── c.set('user', { id, email })
        │
        ├── Postgres brioela.users (trigger on auth.users insert)
        └── BRIOELA_BRAIN.idFromName(user.id) — target; not wired in API yet (G18)
```

Hard doctrine:

- **Single auth provider:** Supabase (`build-guide/04-auth-and-onboarding/00-overview.md`).
- **Stable userId:** Anonymous Supabase user **or** linked Apple/Google user — same `user.id` after `linkIdentity` (`02-sign-in-methods.md`, `03-session-and-route-gating.md`).
- **Guest Mode ≠ anonymous auth:** "Guest Mode" is cooking-for-others (**18-ambient-intelligence**). First-run scan identity is anonymous Supabase user (`03-session-and-route-gating.md`).
- **Device auth ≠ account auth:** `expo-local-authentication` protects local surfaces only (`04-device-biometric-lock.md`).
- **Protected layouts own gating:** `useProtectedRoute` in tabs layout; public routes do not segment-check (`03-session-and-route-gating.md`).

---

## Sign-in methods (intended vs shipped)

### Intended product surface (`brioela-specs/21-onboarding.md`)

| Method | When | Notes |
|---|---|---|
| Supabase anonymous | First app open (pre-scan) | Stable `user.id` before permanent account |
| Apple Sign In | Deferred sign-up prompt | `signInWithIdToken` or `linkIdentity` |
| Google Sign In | Deferred sign-up prompt | Same |
| Email/password | **Not in product spec** | Legacy transition only |

Sign-up prompt appears when user tries to save a recipe, write a community note, or start a voice session — not before first scan value.

### Shipped (`mobile/features/auth/components/account.tsx`)

| Method | Status | Evidence |
|---|---|---|
| Google | Shipped | `expo-auth-session` → `signInWithIdToken({ provider: 'google' })` |
| Apple | Shipped (iOS) | `expo-apple-authentication` → `signInWithIdToken({ provider: 'apple' })` |
| Email/password | Shipped (legacy) | `signInWithPassword`, `signUp`, OTP verify, reset password |
| Anonymous | **Not shipped** | No `signInAnonymously` in repo |
| `linkIdentity` | **Not shipped** | Direct `signInWithIdToken` only |
| Passkey | **Not shipped** | `react-native-passkey` in `package.json`, zero usage |

Post-login route: `router.replace('/tabs/home')` (Schnl fintech tabs, not Brioela product shell).

---

## Mobile Supabase client (shipped)

`mobile/lib/auth/supabase.ts`:

- `@supabase/supabase-js` with `SUPABASE_CONFIG` from `mobile/constants/index.ts`.
- `encryptedAuthAdapter` (`react-native-encrypted-storage`) for session persistence.
- `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`.
- `AppState` listener: `startAutoRefresh` / `stopAutoRefresh` on foreground/background.

Config keys are public anon URL/key (committed in constants — production hardening may move to env).

---

## Auth store (shipped)

`mobile/stores/account/use-auth-store.ts`:

| Field / action | Role |
|---|---|
| `user`, `session` | Supabase User + Session |
| `isLoading` | Boot gate for AppGate |
| `initializeAuth` | `getSession()` + `onAuthStateChange` |
| `signOut` | Supabase signOut, OneSignal logout, `router.replace('/onboarding')` |
| `resetApp` | signOut + `EncryptedStorage.clear()` (account deletion) |

Side effects on sign-in: `OneSignal.login(user.id)`.

Debug: `logSessionSize` on session events — should be gated/removed before production hardening (`01-supabase-auth-setup.md` known gap).

---

## Network client auth attachment (shipped)

`mobile/network/core/client.ts` (axios):

- Request interceptor adds `Authorization: Bearer ${session.access_token}`.
- Adds `userId` query param from `useAuthStore.getState().user?.id`.
- 401 handler bodies are empty stubs — no automatic sign-out on 401.

Backend requires both token **and** matching `userId` query (`auth.ts` lines 61–73). Mobile and middleware are aligned on this Schnl-era contract.

---

## Backend auth middleware (shipped)

`backend/src/core/middleware/auth.ts`:

1. Skip routes in `ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE` (exact or `/*` wildcard).
2. Extract Bearer token from `Authorization`.
3. `getSupabaseAdmin().auth.getUser(token)`.
4. Require `userId` query param === token subject.
5. `c.set('user', { id, email })`.

Mounted globally in `mount.middleware.handler.ts` before routes.

**Schema drift:** `getSupabaseAdmin()` uses `db.schema: 'schnl'` while Drizzle Postgres uses `brioela` schema (**01** G10). Auth validation still works via Supabase Auth API, not Postgres schema.

---

## Skip-list routes (shipped)

`shared/api/no-middleware-check.routes.ts`:

- `/v1/webhooks/*`, `/v1/queue/*`, `/v1/health`, `/v1/temp-pingers/*`, `/v1/auth/*`, `/v1/stress-test/*`, `/v1/in-app-notifications/ws`

`AUTH_ROUTES` (`shared/api/auth.routes.ts`): `base: "/v1/auth"` — **no backend router implemented** (G17).

---

## Session and route gating (shipped)

| Component | Behavior |
|---|---|
| `AppGate` | `initializeAuth()` once; spinner while loading; wraps `AppLockOverlay` |
| `app/index.tsx` | `user` → `/tabs/home`; else → `/onboarding` |
| `useProtectedRoute` | In `tabs/_layout.tsx`; `!user` → `/onboarding` |
| Sign-out | Supabase + OneSignal + `/onboarding` |

**Spec conflict:** Product wants anonymous session + camera-first before permanent auth. Shipped gating requires `user` (any Supabase user) for tabs — but does not create anonymous users, so unauthenticated users hit Schnl onboarding carousel instead of camera scan (G3, G4).

---

## Device biometric lock (shipped)

| Piece | Role |
|---|---|
| `useDeviceAuthGate` | Reads `LOCAL_DEVICE_AUTH_ENABLED` from encrypted storage |
| `AppLockOverlay` | Locks on cold start (if enabled) and after background |
| `SensitiveSheetGate` | Per-sheet `requireDeviceAuth` |
| `profile/security.tsx` | Toggle device auth with enrollment check |
| `local-authentication.ts` | Face ID / Touch ID / passcode via `expo-local-authentication` |

Copy still says "Schnl" in lock overlay (`app-lock-overlay.tsx` line 80, 137).

---

## User profile bootstrap (shipped)

`shared/drizzle/migrations/0002_on_user_signup.sql`:

- Trigger `on_new_user` on `auth.users` AFTER INSERT.
- Inserts `brioela.users (id, email)` mirroring Supabase auth user.

Mobile loads profile via `useUser()` → `getUserById(userId)` → `API_ROUTES.users.getById`.

Delete account: `delete-user.handler.tsx` — checks banking balance + subscription, `supabase.auth.admin.deleteUser`, confirmation email. Mobile `resetApp()` clears local storage.

**Schnl legacy:** User schema includes banking KYC, `brioelaTag`, ledger fields — not Brioela food profile fields.

---

## Onboarding product contract (`brioela-specs/21-onboarding.md`)

### First session flow

1. App opens → full-screen "Point at something you're about to eat" → camera immediately.
2. Scan → verdict under 3 seconds (onboarding = product explains itself).
3. Optional constraint question **only if** verdict flagged something (max 1 question here).
4. Account creation deferred until save / community note / voice session.
5. Second possible question (health avoidances) only after 2nd–3rd scan, skippable.

### Never in onboarding

- Multi-step welcome carousel, health-goal dropdowns, preference wizard.
- Subscription prompt before 3 scans (`19-pricing-and-tiers.md`).
- Permission screens before the action that needs them.

### Permission sequencing

| Permission | When requested |
|---|---|
| Camera | First camera open (first action) |
| Location | First map / local community note |
| Notifications | After first useful scan verdict |
| Microphone | First voice session tap |

### Cold start

No personalization until behavior accumulates. Scan uses base product score only; memory fills over first week.

### Behavioral constraint discovery

Ongoing — not registration forms. Confirmed once per constraint.

---

## Shipped onboarding UI (Schnl legacy — conflicts with spec)

`mobile/app/onboarding.tsx` — 7-slide carousel:

1. Welcome ("One health record" / Schnl branding)
2. OnboardingTwo … OnboardingSix
3. NotifSetup (notifications **before** product value — violates spec)
4. Account (sign-in)

This is a **fintech health-record tour**, not Brioela camera-first onboarding (G4, G5).

Cinematic onboarding (`build-guide/04-auth-and-onboarding/cinematic/`) is design-only — do not implement yet (G21).

---

## Brain / session binding

**Contract:** `user.id` from Supabase auth (anonymous or permanent) keys `env.BRIOELA_BRAIN.idFromName(userId)` (`build-guide/05-brain/01-do-class-and-setup.md`).

**Shipped:** Brain DO class exported (**01**, **04**). No API handler calls `idFromName` for authenticated users (**01** G6, G18). **11** session open/close not shipped. **20** chat entrypoint gap notes userId derivation TBD.

Post-login mobile does not warm Brain DO today.

---

## Tier / subscription at auth boundary

**Spec (`19-pricing-and-tiers.md`, `25-pricing-tiers/03-upgrade-triggers.md`):**

- Scanning never paywalled.
- Tier gating starts **after** onboarding value — inline at feature limits, not at AppGate.
- No subscription prompt before 3 scans.

**Shipped:** `users.paymentStatus`, `subscriptionProductId` from Stripe/Superwall webhooks (**43** partial). No `brioela_plan_tier`, no `checkTierAccess`, no mobile entitlement hook (G19). Auth store does not expose tier.

Delete-account blocks paying users until subscription cancelled (`delete-user.handler.tsx`).

---

## Deep links and app scheme (shipped)

`mobile/app.json`:

- Scheme: `com.brioela.app`
- iOS associated domain: `applinks:brioela.com`
- Android intent: `https://brioela.com/pay` (Schnl pay flow — not auth callback)
- No Supabase OAuth redirect handler in mobile (`detectSessionInUrl: false`)

Google OAuth uses `expo-auth-session` + Supabase `signInWithIdToken` — not universal-link auth callback.

---

## Dependencies on other features

| Feature | Relationship |
|---|---|
| **01** platform-foundation | Hono shell, auth middleware mount, Supabase admin, Postgres, `BRIOELA_BRAIN` binding |
| **02** design-system | Onboarding/sign-in UI must migrate to Brioela tokens/components (currently Schnl styling) |
| **04** brain-foundation | DO export + SQLite spine; HTTP wiring open |
| **11** brain-sessions-lifecycle | Session open after auth; same userId |
| **20** brain-chat-runtime | Chat RPC needs authenticated userId |
| **43** pricing-tiers | Tier read at action gates; webhook → user row |
| **21** platform-notifications | OneSignal.login on auth; notification permission timing in onboarding spec |

---

## Spec vs production conflicts (summary)

| ID | Spec says | Production does |
|---|---|---|
| C1 | Camera-first, no carousel | 7-slide Schnl onboarding carousel |
| C2 | Deferred Apple/Google sign-up | Auth required for tabs; carousel ends at Account sign-in |
| C3 | Supabase anonymous first-run identity | No `signInAnonymously` |
| C4 | Apple/Google only at sign-up | Email/password modal still primary alternate |
| C5 | Notifications after first scan value | `NotifSetup` slide in carousel |
| C6 | Brioela branding | "Schnl" in welcome, account, app lock |
| C7 | `linkIdentity` preserves userId | `signInWithIdToken` only |
| C8 | Brain warmed on user session | No API `idFromName` from auth path |
| C9 | Tier at action gates | No tier column/hook; payment status only |
| C10 | Design system onboarding UI | Legacy Tailwind gray/indigo, not **02** tokens |

---

## Sources

- `build-guide/04-auth-and-onboarding/00-overview.md`
- `build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md`
- `build-guide/04-auth-and-onboarding/02-sign-in-methods.md`
- `build-guide/04-auth-and-onboarding/03-session-and-route-gating.md`
- `build-guide/04-auth-and-onboarding/04-device-biometric-lock.md`
- `build-guide/04-auth-and-onboarding/05-onboarding-flow.md`
- `build-guide/04-auth-and-onboarding/cinematic/README.md`
- `brioela-specs/21-onboarding.md`
- `brioela-specs/00-product-philosophy-and-ux.md`
- `brioela-specs/19-pricing-and-tiers.md`
- `build-guide/25-pricing-tiers/00-overview.md`
- `build-guide/25-pricing-tiers/03-upgrade-triggers.md`
- `build-guide/03-foundation/05-mobile-setup.md`
- `build-guide/02-coding-standards/09-mobile-patterns.md`
- `_records/connections/07-auth-connections.md`
- `_records/build-order/02-layer-auth.md`
- `_records/session-log/036-generative-grammar-contract-delivery.md`
- `_features/01-platform-foundation/spec.md`
- `_features/02-platform-design-system/spec.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/20-brain-chat-runtime/spec.md`
- `_features/43-pricing-tiers/status.md`
