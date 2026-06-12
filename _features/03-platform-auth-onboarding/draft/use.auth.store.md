# Draft: use.auth.store

Target: `mobile/stores/account/use-auth-store.ts`

```
import { create } from 'zustand';
import { supabase } from '@/lib/auth/supabase';
import { router } from 'expo-router';
import { Session, User } from '@supabase/supabase-js';
import EncryptedStorage from 'react-native-encrypted-storage';
import { OneSignal } from 'react-native-onesignal';

/**
 * Safely logs the serialized size of a Supabase session for debugging.
 *
 * @param session - The Supabase session to measure.
 * @param label - A label to identify the log entry.
 */
const logSessionSize = (session: Session | null, label: string = 'supabase_session'): void => {
  if (!session) {
    console.info(`[auth][size][${label}] no session present`);
    return;
  }

  try {
    const serialized = JSON.stringify(session);
    const bytes = new TextEncoder().encode(serialized).length;
    console.info(`[auth][size][${label}] length=${serialized.length} chars, bytes=${bytes}`);
  } catch (error) {
    console.warn(`[auth][size][${label}] failed to measure session`, error);
  }
};

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;

  initializeAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;

  signOut: () => Promise<void>;
  resetApp: () => Promise<void>;

  // clear: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  initializeAuth: async () => {
    try {
      set({ isLoading: true });

      // 1. Get the initial session.
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      // If Supabase returns an error, we throw it to be caught.
      if (error) {
        throw error;
      }

      // 3. Set the initial state based on what was found.
      set({
        session,
        user: session?.user || null,
      });
      logSessionSize(session, 'initial');
      if (session?.user?.id) {
        OneSignal.login(session.user.id);
      }

      // 4. Set up our robust listener.
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        if (event === 'TOKEN_REFRESHED') {
          // The critical fix remains.
          set({ session: newSession, user: newSession?.user || null });
          logSessionSize(newSession, 'token_refreshed');
        } else if (event === 'SIGNED_IN') {
          set({
            session: newSession,
            user: newSession?.user || null,
          });
          logSessionSize(newSession, 'signed_in');
          if (newSession?.user?.id) {
            OneSignal.login(newSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          set({ session: null, user: null });
        }
      });

      // 5. Only now, at the end of a successful setup, do we mark loading as complete.
      set({ isLoading: false });
    } catch (e) {
      // If anything in the try block fails, we catch it here.
      console.error('Error initializing auth:', e);
      // Ensure we are not stuck in a loading state on error.
      set({ isLoading: false });
    }
  },

  // The refined signOut function
  signOut: async () => {
    // Its only job is to tell Supabase to sign out.
    // The onAuthStateChange listener, our single source of truth,
    // will automatically handle updating the application's state.
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    OneSignal.logout();

    router.replace('/onboarding');
  },

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),

  /*
   * Resets the app by signing out and clearing the store.
   * Use this only when you delete the user account.
   * It will wipe everything and reset the app to the onboarding screen.
   */
  resetApp: async () => {
    try {
      await get().signOut();
      await EncryptedStorage.clear();
      set({ user: null, session: null, isLoading: false });
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error resetting app:', error);
      throw error;
    }
  },
}));
```
