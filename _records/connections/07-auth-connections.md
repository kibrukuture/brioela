# Connections — Auth And Onboarding

spec: brioela-specs/21-onboarding.md
  → build-guide/04-auth-and-onboarding/05-onboarding-flow.md [x] done (camera-first, deferred account creation contract, permission sequencing)
  → build-guide/04-auth-and-onboarding/cinematic/            [~] partial (future cinematic onboarding exploration)

spec: brioela-specs/00-product-philosophy-and-ux.md
  → build-guide/04-auth-and-onboarding/05-onboarding-flow.md [x] done (no forms, camera-first, experience before explanation)
  → build-guide/04-auth-and-onboarding/cinematic/            [~] partial (mythic first experience design)

spec: brioela-specs/19-pricing-and-tiers.md
  → build-guide/04-auth-and-onboarding/05-onboarding-flow.md [x] done (no subscription prompt before value)

current code: mobile/lib/auth/supabase.ts
  → build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md [x] done

current code: mobile/stores/account/use-auth-store.ts
  → build-guide/04-auth-and-onboarding/01-supabase-auth-setup.md [x] done
  → build-guide/04-auth-and-onboarding/03-session-and-route-gating.md [x] done

current code: mobile/features/auth/components/account.tsx
  → build-guide/04-auth-and-onboarding/02-sign-in-methods.md [x] done

current code: mobile/features/auth/components/app-gate.tsx
  → build-guide/04-auth-and-onboarding/03-session-and-route-gating.md [x] done

current code: mobile/features/auth/hooks/use-protected-route.ts
  → build-guide/04-auth-and-onboarding/03-session-and-route-gating.md [x] done

current code: mobile/features/auth/components/app-lock-overlay.tsx
  → build-guide/04-auth-and-onboarding/04-device-biometric-lock.md [x] done

current code: mobile/features/auth/hooks/use-device-auth-gate.ts
  → build-guide/04-auth-and-onboarding/04-device-biometric-lock.md [x] done
