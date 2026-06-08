# Auth — Supabase Setup

## What This File Covers

The current mobile Supabase auth client, encrypted session storage, token refresh behavior, and auth state store.

## Current Code References

- `mobile/lib/auth/supabase.ts`
- `mobile/stores/account/use-auth-store.ts`
- `mobile/lib/storage/encrypted-storage.ts`
- `mobile/constants/index.ts`

## Current Implementation

- Mobile uses `@supabase/supabase-js`.
- Supabase client is created in `mobile/lib/auth/supabase.ts`.
- Session storage uses `encryptedAuthAdapter`.
- `autoRefreshToken` is enabled.
- `persistSession` is enabled.
- `detectSessionInUrl` is disabled for native app flow.
- AppState starts/stops Supabase auto-refresh when app enters foreground/background.

## Auth Store

`useAuthStore` owns:

- `user`
- `session`
- `isLoading`
- `initializeAuth`
- `signOut`
- `resetApp`

`initializeAuth`:

- calls `supabase.auth.getSession()`
- stores session and user
- registers `supabase.auth.onAuthStateChange`
- logs session size for debugging
- calls `OneSignal.login(user.id)` when signed in

## Important Decisions

- Supabase Auth is the only auth provider.
- Backend validates Supabase access tokens.
- Mobile attaches Supabase access token to network requests through `mobile/network/core/client.ts`.
- Private Brioela agent/Brain identity depends on stable Supabase `user.id`.

## Known Gaps

- Guest scan identity uses Supabase anonymous auth.
- Account migration links the anonymous Supabase user to Apple/Google/email when the user chooses to make the account permanent.
- Session size logging should be removed or gated before production hardening.
