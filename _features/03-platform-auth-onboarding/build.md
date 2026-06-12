# Platform Auth + Onboarding — Build

Feature **03**. Mobile Supabase auth, encrypted session storage, route gating, device lock, backend JWT middleware, Postgres user bootstrap, and Brioela camera-first onboarding migration.

---

## Build order (within feature)

Implement in this sequence — each layer depends on the previous:

1. **Anonymous session path** — `ensureAnonymousSession`, extend `initializeAuth` / `app/index.tsx` so first open gets stable `user.id` without carousel sign-in.
2. **Camera-first onboarding route** — Replace Schnl carousel with redirect to scanner/camera (**24** composes verdict UI).
3. **Link identity** — `use-link-identity.ts`; Apple/Google call `linkIdentity` when `user.is_anonymous`.
4. **Deferred sign-up gates** — Prompt components at save / note / voice actions (owned by respective features; auth provides hook + modal shell).
5. **Backend auth router** (if needed) — `/v1/auth/*` handlers only if server-mediated flows required; otherwise client-only Supabase stays sufficient.
6. **Brain warm on session** — `ensureBrainForUser` API + mobile call after auth ready (**04**, **20**).
7. **Design-system auth UI** — Restyle sign-in / lock / onboarding per **02** tokens.
8. **Tier hook at profile** — `useEntitlement` reads `brioela_plan_tier` when **43** ships (not at AppGate).
9. **Hardening** — Remove session size logs, gate 401 → signOut, move Supabase keys to env, remove unused `react-native-passkey` or implement.

---

## Package dependencies

### Mobile (`mobile/package.json`) — already installed

| Package | Role |
|---|---|
| `@supabase/supabase-js` | Auth client |
| `react-native-encrypted-storage` | Session adapter |
| `expo-apple-authentication` | Apple Sign In |
| `expo-auth-session`, `expo-web-browser` | Google OAuth |
| `expo-local-authentication` | Device lock |
| `expo-secure-store` | Secure storage plugin |
| `react-native-onesignal` | `OneSignal.login/logout` on auth events |
| `zustand` | `useAuthStore`, `useAuthFlowStore` |
| `usehooks-ts` | `useIsomorphicLayoutEffect` in auth components |

### Mobile — policy / cleanup

| Package | Status | Action |
|---|---|---|
| `react-native-passkey` | Installed, unused | Remove or implement (G16) |
| `axios` | Network client | **01** G12 — migrate to fetch when touching client |

### Backend — already installed

| Package | Role |
|---|---|
| `@supabase/supabase-js` | Admin client JWT validation |
| `hono` | Auth middleware |

---

## File map — mobile auth (`mobile/`)

| File | Role | Status |
|---|---|---|
| `lib/auth/supabase.ts` | Supabase client + AppState refresh | **Shipped** — `draft/supabase.mobile.client.md` |
| `lib/auth/local-authentication.ts` | Biometric helpers | **Shipped** — `draft/local.authentication.md` |
| `lib/auth/anonymous-session.ts` | `signInAnonymously` wrapper | **Gap** — `draft/anonymous.auth.gap.md` |
| `lib/storage/encrypted-storage.ts` | Session + prefs adapter | **Shipped** — `draft/encrypted.storage.md` |
| `stores/account/use-auth-store.ts` | Auth state | **Shipped** — `draft/use.auth.store.md` |
| `stores/account/use-auth-flow-store.ts` | Email verify temp creds | **Shipped** (legacy email flow) |
| `features/auth/components/app-gate.tsx` | Boot init | **Shipped** — `draft/app.gate.md` |
| `features/auth/components/app-lock-overlay.tsx` | Device lock UI | **Shipped** — `draft/app.lock.overlay.md` |
| `features/auth/components/account.tsx` | Sign-in surface | **Shipped** (Schnl) — `draft/account.sign-in.md` |
| `features/auth/components/auth-with-email.tsx` | Email modal | **Shipped** (legacy) |
| `features/auth/components/email-verification-code.tsx` | OTP verify | **Shipped** (legacy) |
| `features/auth/hooks/use-protected-route.ts` | Tab guard | **Shipped** — `draft/use.protected.route.md` |
| `features/auth/hooks/use-device-auth-gate.ts` | Sensitive auth | **Shipped** — `draft/use.device.auth.gate.md` |
| `features/auth/hooks/use-link-identity.ts` | Anonymous linking | **Gap** — `draft/link.identity.gap.md` |
| `features/auth/hooks/use-sensitive-auth.ts` | Wrapper | **Shipped** |
| `features/auth/components/sensitive-sheet-gate.tsx` | Sheet guard | **Shipped** |
| `network/core/client.ts` | Bearer + userId | **Shipped** — `draft/mobile.network.client.md` |
| `network/users/use-user.ts` | Profile query | **Shipped** |
| `app/_layout.tsx` | AppGate mount | **Shipped** |
| `app/index.tsx` | Root redirect | **Shipped** — `draft/app.index.md` |
| `app/onboarding.tsx` | Onboarding route | **Shipped** (wrong UX) — `draft/onboarding.screen.md` |
| `app/tabs/_layout.tsx` | Protected tabs | **Shipped** (Schnl tabs) |
| `app/profile/security.tsx` | Device auth toggle | **Shipped** |
| `app/profile/delete-account.tsx` | Account deletion | **Shipped** (Schnl banking copy) |
| `constants/index.ts` | Supabase + OAuth config | **Shipped** (public keys committed) |

---

## File map — backend auth (`backend/src/`)

| File | Role | Status |
|---|---|---|
| `core/middleware/auth.ts` | JWT + userId validation | **Shipped** — `draft/auth.middleware.md` |
| `core/database/supabase-admin-client.ts` | Service role client | **Shipped** — `draft/supabase.admin.client.md` |
| `app/mount.middleware.handler.ts` | Mount auth + skip list | **Shipped** — `draft/mount.middleware.handler.md` |
| `api/auth/auth.routes.ts` | `/v1/auth/*` handlers | **Gap** — `draft/backend.auth.routes.gap.md` |
| `api/users/handlers/delete-user.handler.tsx` | Account deletion | **Shipped** |
| `api/brain/handlers/ensure-brain.handler.ts` | DO warm | **Gap** — `draft/brain.userid.binding.gap.md` |

---

## File map — shared (`shared/`)

| File | Role | Status |
|---|---|---|
| `api/auth.routes.ts` | Route constants | **Shipped** — `draft/auth.routes.md` |
| `api/no-middleware-check.routes.ts` | Auth skip list | **Shipped** — `draft/no.middleware.check.routes.md` |
| `drizzle/migrations/0002_on_user_signup.sql` | User bootstrap trigger | **Shipped** — `draft/on.user.signup.sql.md` |
| `drizzle/schema/user.schema.ts` | `brioela.users` | **Shipped** (Schnl/fintech columns) |
| `drizzle/schema/auth-signature-challenges.schema.ts` | Wallet auth challenges | **Shipped** (banking — not mobile auth) |

---

## File map — onboarding UX (target)

| File | Role | Status |
|---|---|---|
| `app/onboarding.tsx` | Camera-first redirect | **Gap** — `draft/camera.first.onboarding.gap.md` |
| `features/onboarding/deferred-sign-up-sheet.tsx` | Apple/Google prompt at gates | **Not in repo** |
| `build-guide/04-auth-and-onboarding/cinematic/*` | Future cinematic | **Design only** — `draft/cinematic.onboarding.gap.md` |

---

## Acceptance criteria

### Auth session (shipped baseline)

- [x] Supabase client persists session in encrypted storage
- [x] Token auto-refresh on app foreground
- [x] `useAuthStore.initializeAuth` runs once at boot via `AppGate`
- [x] API requests send Bearer token + `userId` query param
- [x] Backend rejects missing token, invalid token, userId mismatch
- [x] Sign-out clears Supabase session and routes to `/onboarding`
- [x] OneSignal user id synced on sign-in/out

### Auth session (open)

- [ ] Anonymous session on first open (`signInAnonymously`)
- [ ] `linkIdentity` preserves `user.id` for Brain data
- [ ] 401 response triggers sign-out or refresh (client handler today empty)
- [ ] Session size debug logs removed or `__DEV__` gated
- [ ] Supabase keys from env, not hardcoded constants

### Route gating (shipped baseline)

- [x] Unauthenticated users cannot stay on protected tabs
- [x] Root index redirects based on auth state

### Route gating (open)

- [ ] Anonymous users can reach camera/scan without carousel sign-in
- [ ] Post-login lands on Brioela home (not Schnl banking tabs)
- [ ] Deferred sign-up only at product action gates

### Onboarding product (open)

- [ ] First screen is camera prompt, not carousel
- [ ] No notification permission before first scan verdict
- [ ] Max two onboarding questions per `21-onboarding.md`
- [ ] No subscription prompt before 3 scans
- [ ] Apple/Google only at permanent account prompt (email legacy removed or hidden)

### Device lock (shipped baseline)

- [x] Optional biometric lock after background
- [x] Sensitive sheets can require device auth
- [x] Security settings toggle persists preference

### Device lock (open)

- [ ] Copy uses Brioela branding (not Schnl)
- [ ] Production lock policy documented and tested

### Profile bootstrap (shipped)

- [x] New Supabase user creates `brioela.users` row via trigger
- [x] Mobile fetches user profile by id
- [x] Delete account enforces balance/subscription guards

### Brain binding (open)

- [ ] Authenticated API path addresses `BRIOELA_BRAIN.idFromName(user.id)`
- [ ] Mobile warms Brain after session ready (optional RPC)

### Tier boundary (open — blocked on **43**)

- [ ] `useEntitlement` reads plan tier from user profile
- [ ] No tier check in `AppGate` or `useProtectedRoute`
- [ ] Upgrade prompts at feature limits only

### Design system (open — **02**)

- [ ] Sign-in, lock overlay, onboarding use Brioela design tokens
- [ ] Remove Schnl logo/copy from auth surfaces

---

## Cross-feature build notes

| Consumer | What **03** must provide |
|---|---|
| **04** / **20** | Stable `user.id` for Brain DO RPC |
| **11** | Same userId at session open |
| **21** | OneSignal login; notification permission after first scan |
| **24** | Anonymous or authed user can open camera |
| **43** | User row exists; tier column + hook when shipped |
| **02** | Auth UI restyled with design-system components |

---

## Draft index

**26** files in `draft/`:

| Draft | Type |
|---|---|
| `auth.middleware.md` | Production |
| `supabase.mobile.client.md` | Production |
| `supabase.admin.client.md` | Production |
| `use.auth.store.md` | Production |
| `encrypted.storage.md` | Production |
| `app.gate.md` | Production |
| `app.lock.overlay.md` | Production |
| `account.sign-in.md` | Production |
| `use.protected.route.md` | Production |
| `use.device.auth.gate.md` | Production |
| `local.authentication.md` | Production |
| `mobile.network.client.md` | Production |
| `mount.middleware.handler.md` | Production |
| `no.middleware.check.routes.md` | Production |
| `auth.routes.md` | Production |
| `on.user.signup.sql.md` | Production |
| `onboarding.screen.md` | Production (legacy) |
| `app.index.md` | Production |
| `anonymous.auth.gap.md` | Gap |
| `link.identity.gap.md` | Gap |
| `camera.first.onboarding.gap.md` | Gap |
| `brain.userid.binding.gap.md` | Gap |
| `tier.gate.auth.boundary.gap.md` | Gap |
| `passkey.unused.gap.md` | Gap |
| `backend.auth.routes.gap.md` | Gap |
| `cinematic.onboarding.gap.md` | Gap (design-only) |
