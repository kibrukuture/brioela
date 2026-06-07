# Auth — Sign-In Methods

## What This File Covers

Current sign-in methods in the mobile app.

## Current Code References

- `mobile/features/auth/components/account.tsx`
- `mobile/features/auth/components/auth-with-email.tsx`
- `mobile/features/auth/components/email-verification-code.tsx`
- `mobile/features/auth/components/forgot-password-code.tsx`
- `mobile/features/auth/components/reset-password.tsx`
- `mobile/features/auth/components/reset-password-form.tsx`

## Current Methods

### Google

- Uses `expo-auth-session/providers/google`.
- Receives Google `idToken`.
- Calls `supabase.auth.signInWithIdToken({ provider: "google" })`.

### Apple

- Uses `expo-apple-authentication`.
- Receives Apple `identityToken`.
- Calls `supabase.auth.signInWithIdToken({ provider: "apple" })`.

### Email / Password Legacy Surface

- Current code may still support email/password sign-in and sign-up during transition.
- Validation uses `signInSchema`, `signUpSchema`, and `forgotPasswordSchema`.
- Sign-up stores temporary credentials and moves to email verification flow.

### Reset Password

- Forgot password sends reset email through Supabase.
- Reset password updates user password through `supabase.auth.updateUser`.

## Product Spec Tension

`brioela-specs/21-onboarding.md` says Apple/Google only and no email/password forms.

Target product surface is Apple/Google account linking from a Supabase anonymous user. Email/password is legacy/current-code surface only unless explicitly re-approved.
