# Auth — Session And Route Gating

## What This File Covers

App boot, auth initialization, protected tab access, and route behavior.

## Current Code References

- `mobile/features/auth/components/app-gate.tsx`
- `mobile/features/auth/hooks/use-protected-route.ts`
- `mobile/app/_layout.tsx`
- `mobile/app/tabs/_layout.tsx`
- `mobile/stores/account/use-auth-store.ts`

## Current Flow

### AppGate

- Mounted in root layout.
- Calls `useAuthStore().initializeAuth()` once on startup.
- Shows loading spinner while auth store initializes.
- Wraps the app in `AppLockOverlay` after auth is loaded.

### Protected Tabs

- `mobile/app/tabs/_layout.tsx` calls `useProtectedRoute()`.
- `useProtectedRoute()` waits for auth loading to finish.
- If no user exists, it redirects to `/onboarding`.

### Post Login

- Successful sign-in replaces route with `/tabs/home`.

### Sign Out

- Supabase signs out.
- OneSignal logs out.
- Router replaces with `/onboarding`.

## Important Decisions

- Protected layouts own protection.
- Public routes do not need segment checking.
- Auth store is the single source of truth for signed-in user/session.

## Known Gaps

- Deferred account creation uses Supabase anonymous auth, so protected tabs can receive a real Supabase user ID before permanent account linking.
- Reserve "Guest Mode" for cooking for others. Auth-side first-run identity is "anonymous user" or "anonymous Supabase user," not guest.
- Orchestrator DO addressing depends on Supabase user ID from anonymous or permanent auth. Do not add another identity strategy.
