# Status

open

**Schnl-era auth stack is shipped** (Supabase client, encrypted session, auth store, AppGate, protected tabs, backend JWT middleware, user bootstrap trigger, device lock). **Brioela product auth + onboarding is not shipped:** no anonymous first-run identity, no camera-first onboarding, no `linkIdentity`, Schnl carousel + email/password + banking tabs remain, Brain DO not wired from auth path, tier entitlements not at profile boundary. Status stays `open`.

# Shipped in repo (partial)

## Mobile — Supabase auth
- [x] `lib/auth/supabase.ts` — client, encrypted storage, AppState refresh
- [x] `stores/account/use-auth-store.ts` — session, init, signOut, resetApp, OneSignal sync
- [x] `lib/storage/encrypted-storage.ts` — `encryptedAuthAdapter`
- [x] Google + Apple `signInWithIdToken` (`features/auth/components/account.tsx`)
- [x] Email/password sign-in, sign-up, OTP verify, reset password (legacy)
- [x] `stores/account/use-auth-flow-store.ts` — temp creds for email flow

## Mobile — route gating
- [x] `features/auth/components/app-gate.tsx` — boot `initializeAuth`
- [x] `features/auth/hooks/use-protected-route.ts` — tab redirect
- [x] `app/index.tsx` — user → tabs, else onboarding
- [x] `app/_layout.tsx` — AppGate wraps Stack

## Mobile — device lock
- [x] `features/auth/components/app-lock-overlay.tsx`
- [x] `features/auth/hooks/use-device-auth-gate.ts`
- [x] `features/auth/components/sensitive-sheet-gate.tsx`
- [x] `lib/auth/local-authentication.ts`
- [x] `app/profile/security.tsx` — device auth toggle

## Mobile — API auth attachment
- [x] `network/core/client.ts` — Bearer + `userId` query param

## Mobile — profile
- [x] `network/users/use-user.ts` — profile fetch
- [x] `app/profile/delete-account.tsx` + backend delete handler

## Backend
- [x] `core/middleware/auth.ts` — Supabase JWT + userId match
- [x] `core/database/supabase-admin-client.ts`
- [x] `app/mount.middleware.handler.ts` — global auth + skip list
- [x] `api/users/handlers/delete-user.handler.tsx`

## Shared / Postgres
- [x] `api/auth.routes.ts` — route constant only
- [x] `api/no-middleware-check.routes.ts` — includes `/v1/auth/*`
- [x] `drizzle/migrations/0002_on_user_signup.sql` — `auth.users` → `brioela.users` trigger
- [x] `drizzle/schema/user.schema.ts` — users table (Schnl/fintech shape)

## Docs
- [x] `build-guide/04-auth-and-onboarding/` (00–05 + cinematic design folder)
- [x] `brioela-specs/21-onboarding.md`
- [x] `_records/connections/07-auth-connections.md`

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No Supabase anonymous auth (`signInAnonymously`) | `rg signInAnonymously mobile/` — zero; `05-onboarding-flow.md` known gap |
| G2 | No `linkIdentity` — anonymous → Apple/Google | `account.tsx` uses `signInWithIdToken` only; `02-sign-in-methods.md` |
| G3 | Auth required before tabs — blocks deferred account creation | `use-protected-route.ts` `!user` → `/onboarding`; spec defers sign-up |
| G4 | Onboarding is 7-slide Schnl carousel, not camera-first | `onboarding.tsx` screens array; `welcome.tsx` "One health record" |
| G5 | `NotifSetup` slide before product value | `onboarding.tsx` includes `NotifSetup`; `21-onboarding.md` § notifications after first verdict |
| G6 | Schnl branding on auth surfaces | `account.tsx` line 312, `app-lock-overlay.tsx` lines 80/137 |
| G7 | Post-login → Schnl fintech tabs (Home/Activities/Recipients/Cards) | `account.tsx` `router.replace('/tabs/home')`; `tabs/_layout.tsx` |
| G8 | Email/password still primary alternate — spec Apple/Google only | `account.tsx` email modal + schemas; `21-onboarding.md` |
| G9 | No backend `/v1/auth/*` router implementation | `glob backend/src/api/auth` — zero; `AUTH_ROUTES` constant only |
| G10 | Brain DO not addressed from auth/API path | `rg idFromName backend/src/api` — zero; **01** G6 |
| G11 | `getSupabaseAdmin` schema `schnl` vs Drizzle `brioela` | `supabase-admin-client.ts` line 14; **01** G10 |
| G12 | `userId` query param required on all authed API calls — legacy Schnl | `auth.ts` lines 61–67; not in foundation guide sample |
| G13 | Mobile 401 handler empty — no token refresh/sign-out | `client.ts` lines 67–75 empty blocks |
| G14 | Session size debug logging in production path | `use-auth-store.ts` `logSessionSize` |
| G15 | Supabase URL/anon key hardcoded in `constants/index.ts` | Public keys committed |
| G16 | `react-native-passkey` installed, unused | `mobile/package.json`; `rg passkey mobile/` — zero |
| G17 | No `useEntitlement` / tier at profile boundary | **43** G1–G7; `user.schema.ts` no `brioela_plan_tier` |
| G18 | Cinematic onboarding design-only — not product blocker | `cinematic/README.md` "Do not code this yet" |
| G19 | `longevity-deck` / `onboarding-superlist` — Schnl legacy components | `mobile/components/longevity-deck/`, `onboarding-superlist/` |
| G20 | Deep links: pay flow only, no OAuth universal-link auth | `app.json` intentFilters `/pay`; `detectSessionInUrl: false` |
| G21 | Auth UI not on **02** design system | Schnl gray/indigo classes; **02** G1–G8 |
| G22 | `auth-signature-challenges` table — banking wallet auth, not mobile session | `auth-signature-challenges.schema.ts` |
| G23 | Delete-account copy references banking balance/KYC | `delete-account.tsx` lines 60–70 |

# Spec vs production conflicts

| ID | Spec | Production |
|---|---|---|
| C1 | Camera-first onboarding | Schnl carousel |
| C2 | Deferred permanent account | Sign-in required for tabs |
| C3 | Anonymous Supabase identity | Not implemented |
| C4 | Apple/Google only at sign-up | Email/password exposed |
| C5 | Notifications after first scan | NotifSetup in carousel |
| C6 | Brioela branding | Schnl throughout auth |
| C7 | `linkIdentity` preserves userId | Direct sign-in only |
| C8 | Brain keyed on auth userId | No API wiring |
| C9 | Tier gates at feature actions | No tier hook; payment status only |
| C10 | Max 2 onboarding questions | Multi-slide tour + auth |

# Blocked by

- **01-platform-foundation** (partial) — auth middleware shipped; Brain HTTP wiring open (**01** G6); schema `schnl`/`brioela` drift (**01** G10)
- **02-platform-design-system** (partial) — auth/onboarding UI still Schnl legacy; Brioela restyle blocked on tokens/components

# Blocks

- **04-brain-foundation** — needs stable authenticated `user.id` + optional warm RPC
- **11-brain-sessions-lifecycle** — session open assumes userId from auth
- **20-brain-chat-runtime** — chat entrypoint needs userId derivation
- **24-scanner** — camera-first onboarding assumes anonymous/authed scan path
- **21-platform-notifications** — OneSignal login shipped; permission timing depends on onboarding migration
- **43-pricing-tiers** — tier read from user profile; upgrade prompts after onboarding value
- All features using `useAuthStore` or backend `c.get('user')`

# Sources

- `build-guide/04-auth-and-onboarding/00-overview.md`
- `build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md`
- `build-guide/04-auth-and-onboarding/02-sign-in-methods.md`
- `build-guide/04-auth-and-onboarding/03-session-and-route-gating.md`
- `build-guide/04-auth-and-onboarding/04-device-biometric-lock.md`
- `build-guide/04-auth-and-onboarding/05-onboarding-flow.md`
- `build-guide/04-auth-and-onboarding/cinematic/README.md`
- `build-guide/03-foundation/05-mobile-setup.md`
- `build-guide/02-coding-standards/09-mobile-patterns.md`
- `build-guide/25-pricing-tiers/00-overview.md`
- `build-guide/25-pricing-tiers/03-upgrade-triggers.md`
- `build-guide/25-pricing-tiers/04-access-checks-and-tools.md`
- `brioela-specs/21-onboarding.md`
- `brioela-specs/00-product-philosophy-and-ux.md`
- `brioela-specs/19-pricing-and-tiers.md`
- `brioela-specs/24-technical-architecture-backbone.md`
- `_records/connections/07-auth-connections.md`
- `_records/build-order/02-layer-auth.md`
- `_records/session-log/036-generative-grammar-contract-delivery.md`
- `_features/01-platform-foundation/spec.md`
- `_features/01-platform-foundation/status.md`
- `_features/02-platform-design-system/spec.md`
- `_features/02-platform-design-system/status.md`
- `_features/04-brain-foundation/status.md`
- `_features/11-brain-sessions-lifecycle/status.md`
- `_features/20-brain-chat-runtime/status.md`
- `_features/43-pricing-tiers/status.md`
- Production: `mobile/lib/auth/`, `mobile/features/auth/`, `mobile/stores/account/`, `mobile/app/onboarding.tsx`, `backend/src/core/middleware/auth.ts`, `shared/drizzle/migrations/0002_on_user_signup.sql`

# Draft count

**26** files in `draft/` — 18 production snapshots + 8 gap targets.
