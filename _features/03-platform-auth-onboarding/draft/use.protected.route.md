# Draft: use.protected.route

Target: `mobile/features/auth/hooks/use-protected-route.ts`

```
import { useIsomorphicLayoutEffect } from 'usehooks-ts';
import { useRouter } from 'expo-router'; // We don't even need useSegments anymore
import { useAuthStore } from '@/stores/account/use-auth-store';

export function useProtectedRoute() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useIsomorphicLayoutEffect(() => {
    if (isLoading) {
      return; // Wait for auth state to load
    }

    // Since this hook is ONLY used in protected layouts, we don't need to check
    // which group we are in. If we are executing this code, we are in a protected area.

    if (!user) {
      // If no user, redirect to onboarding.
      router.replace('/onboarding');
    }
  }, [user, isLoading, router]);
}
```
