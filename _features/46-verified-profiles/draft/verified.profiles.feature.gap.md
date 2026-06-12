# Draft: verified.profiles.feature.tsx (gap — file does not exist)

Target: `mobile/features/verified-profiles/verified.profiles.feature.tsx`

Source: `build.md` mobile manifest, `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

---

```tsx
import { useEntitlement } from '@/mobile/features/pricing/hooks/use.entitlement'
import { VerificationApplicationForm } from './components/verification.application.form'
import { PractitionerDashboard } from './components/practitioner.dashboard'
import { BusinessTransparencyEditor } from './components/business.transparency.editor'
import { ClientConnectionConsentSheet } from './components/client.connection.consent.sheet'
import { PublicProfileScreen } from './components/public.profile.screen'

type VerifiedProfilesMode = 'apply' | 'practitioner' | 'business' | 'public'

type VerifiedProfilesFeatureProps = {
  mode: VerifiedProfilesMode
  profileSlug?: string
}

export function VerifiedProfilesFeature({ mode, profileSlug }: VerifiedProfilesFeatureProps) {
  const { tier, checkAction } = useEntitlement()
  const hasSignet = tier === 'signet' || checkAction('verified_profile').allowed

  if (mode === 'public' && profileSlug) {
    return <PublicProfileScreen slug={profileSlug} />
  }

  if (!hasSignet) {
    return null // **43** upgrade sheet at navigation site
  }

  switch (mode) {
    case 'apply':
      return <VerificationApplicationForm />
    case 'practitioner':
      return (
        <>
          <PractitionerDashboard />
          <ClientConnectionConsentSheet />
        </>
      )
    case 'business':
      return <BusinessTransparencyEditor />
    default:
      return null
  }
}
```

**Consent UX:** `ClientConnectionConsentSheet` shows `practitionerScopeLabels` before accept — user must pick granted scopes.
