# Auth — Device Biometric Lock

## What This File Covers

Current local device authentication and app lock behavior.

## Current Code References

- `mobile/features/auth/hooks/use-device-auth-gate.ts`
- `mobile/features/auth/hooks/use-local-authentication.ts`
- `mobile/features/auth/hooks/use-sensitive-auth.ts`
- `mobile/features/auth/components/app-lock-overlay.tsx`
- `mobile/features/auth/components/sensitive-sheet-gate.tsx`
- `mobile/lib/auth/local-authentication.ts`

## Current Behavior

- Local device auth preference is stored in encrypted storage.
- `useDeviceAuthGate` checks whether local auth is enabled.
- If enabled, sensitive actions can require device auth.
- `AppLockOverlay` can lock the whole app after backgrounding.
- Unlock button label adapts to Face ID / Touch ID / passcode availability.

## Current Sensitive Auth Uses

- `SensitiveSheetGate` guards sensitive bottom-sheet flows.
- `useSensitiveAuth` wraps `requireDeviceAuth`.

## Important Decisions

- Device auth is local-device security, not account auth.
- Device auth should not replace Supabase authentication.
- Sensitive action gating is preferred over forcing auth on every screen.

## Known Gaps

- Copy still says `Schnl` in places.
- Exact production lock policy needs review.
- Device auth settings UI should be documented when finalized.
