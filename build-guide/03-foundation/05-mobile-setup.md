# Foundation — Mobile Setup

## What Mobile Is

Expo React Native app using Expo Router for file-based navigation. No `src/` wrapper — all folders sit directly under `mobile/`.

---

## `mobile/tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict":     true,
    "skipLibCheck": true,
    "baseUrl":    ".",
    "paths": {
      "@/*":               ["./*"],
      "@brioela/shared/*": ["../shared/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts",
    "nativewind-env.d.ts"
  ]
}
```

`@/*` resolves from the mobile root — so `@/network/scan` → `mobile/network/scan`.

---

## `mobile/app.json` — Key Config

```json
{
  "expo": {
    "name":   "Brioela",
    "slug":   "brioela",
    "scheme": "com.brioela.app",
    "version": "1.0.0",

    "newArchEnabled": true,

    "experiments": {
      "typedRoutes":   true,
      "tsconfigPaths": true
    },

    "orientation": "portrait",
    "userInterfaceStyle": "light",

    "ios": {
      "bundleIdentifier": "com.brioela.app",
      "jsEngine":         "hermes",
      "supportsTablet":   false,
      "usesAppleSignIn":  true
    },

    "android": {
      "package":         "com.brioela.app",
      "jsEngine":        "hermes",
      "edgeToEdgeEnabled": true
    },

    "plugins": [
      "expo-router",
      "expo-secure-store",
      ["expo-camera", {
        "cameraPermission":     "Allow Brioela to access your camera to scan products.",
        "microphonePermission": "Allow Brioela to access your microphone.",
        "recordAudioAndroid":   true
      }],
      ["expo-notifications", {
        "icon":  "./assets/images/notification_icon.png",
        "color": "#ffffff"
      }],
      ["expo-font", {
        "fonts": ["./assets/fonts/PlusJakartaSans-Variable.ttf"]
      }],
      ["expo-splash-screen", {
        "backgroundColor": "#F8F6F2",
        "image":           "./assets/images/splash.png",
        "imageWidth":      400
      }],
      ["expo-build-properties", {
        "ios": {
          "deploymentTarget": "16.4",
          "useFrameworks":    "static"
        },
        "android": {
          "minSdkVersion": 26
        }
      }]
    ],

    "extra": {
      "eas": { "projectId": "4e044f04-3127-4ae6-9c12-12c56ea4ca05" }
    },

    "owner": "kibrukuture"
  }
}
```

`newArchEnabled: true` — React Native new architecture. Required for Skia and Reanimated v4.

---

## Folder Structure

No `src/` wrapper. All folders sit directly under `mobile/` — matching `"@/*": ["./*"]` in tsconfig.

```
mobile/
├── app/                    ← Expo Router screens (thin — no logic)
│   ├── _layout.tsx         ← root layout: providers, fonts, navigation
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx       ← scanner tab
│   │   ├── ground.tsx
│   │   ├── map.tsx
│   │   └── profile.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── recipe/[id].tsx
│   ├── cooking-session/[sessionId].tsx
│   └── +not-found.tsx
│
├── network/                ← ALL server state — one folder per API domain
├── features/               ← feature UI — composes network hooks + local state
├── stores/                 ← Zustand stores — one folder per concern
├── components/             ← shared design system components
├── design-system/          ← tokens, variants, shaders, motion
├── providers/              ← React context providers (QueryProvider, etc.)
├── lib/                    ← pure utilities (cn, format, assert)
│
├── assets/
│   ├── fonts/
│   └── images/
│
├── global.css              ← NativeWind CSS variables
├── tailwind.config.ts
├── app.json
├── tsconfig.json
└── package.json
```

---

## `app/_layout.tsx` — Root Layout

```tsx
import { useCallback } from 'react'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as SplashScreen from 'expo-splash-screen'
import * as SystemUI from 'expo-system-ui'
import { useFonts } from 'expo-font'
import { QueryProvider } from '@/providers/query.provider'
import { useAuthStore } from '@/stores/auth/use.auth.store'

SystemUI.setBackgroundColorAsync('#F8F6F2')
SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans': require('@/assets/fonts/PlusJakartaSans-Variable.ttf'),
  })

  const onLayout = useCallback(async () => {
    if (fontsLoaded || fontError) await SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  useIsomorphicLayoutEffect(() => {
    useAuthStore.getState().initialize()
  }, [])

  if (!fontsLoaded && !fontError) return null

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
        <QueryProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}
```

Every effect hook uses `useIsomorphicLayoutEffect` from `usehooks-ts`. Never `useEffect` or `useLayoutEffect` directly.

---

## QueryProvider — `src/providers/query.provider.tsx`

```tsx
import React from 'react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import AsyncStorage from '@react-native-async-storage/async-storage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime:    1000 * 60 * 60 * 24,  // 24 hours — offline cache
      staleTime: 1000 * 60 * 5,        // 5 minutes — background refetch
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key:     'BrioelaQueryCache',
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      {children}
    </PersistQueryClientProvider>
  )
}
```

24-hour `gcTime` means cached data survives app restarts — users see stale data instantly while fresh data loads in the background.

---

## Network Client — `src/network/core/client.ts`

Native `fetch` — no axios. Auth token and userId injected on every request.

```ts
// src/network/core/client.ts
import { useAuthStore } from '@/stores/auth/use.auth.store'
import { AppError } from '@brioela/shared'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL

async function request<T>(
  method: string,
  url: string,
  options?: { body?: unknown; params?: Record<string, string> }
): Promise<T> {
  const token  = useAuthStore.getState().session?.accessToken
  const userId = useAuthStore.getState().user?.id

  const fullUrl = new URL(BASE_URL + url)
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => fullUrl.searchParams.set(k, v))
  }
  if (userId) fullUrl.searchParams.set('userId', userId)

  const res = await fetch(fullUrl.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  const json = await res.json()
  if (!res.ok) throw new AppError(json.error, json.message, res.status)
  return json.data as T
}

export const api = {
  get:   <T>(url: string, params?: Record<string, string>) => request<T>('GET', url, { params }),
  post:  <T>(url: string, body?: unknown) => request<T>('POST', url, { body }),
  put:   <T>(url: string, body?: unknown) => request<T>('PUT', url, { body }),
  patch: <T>(url: string, body?: unknown) => request<T>('PATCH', url, { body }),
  del:   <T>(url: string) => request<T>('DELETE', url),
}
```

---

## Environment Variables — Mobile

Expo uses `EXPO_PUBLIC_` prefix for client-side env vars. These are embedded at build time.

```
# mobile/.env (gitignored)
EXPO_PUBLIC_API_URL=https://api.brioela.com
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Access via `process.env.EXPO_PUBLIC_API_URL` — no `dotenv`, Expo handles loading.

---

## `global.css` — NativeWind Tokens

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Brioela light palette — warm naturals */
    --background:        248 246 242;   /* F8F6F2 — warm off-white */
    --background-deep:   237 233 227;   /* EDE9E3 — deeper warm */
    --text-primary:      28 25 23;      /* 1C1917 — near-black warm */
    --text-secondary:    120 113 108;   /* 78716C — muted warm */
    --accent-primary:    20 184 166;    /* 14B8A6 — teal */
    --accent-safe:       34 197 94;     /* 22C55E — green */
    --accent-caution:    234 179 8;     /* EAB308 — amber */
    --accent-danger:     239 68 68;     /* EF4444 — red */
    --surface:           255 255 255;   /* pure white card */
    --border:            229 225 219;   /* warm gray */
  }
}
```

---

## `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'rgb(var(--background) / <alpha-value>)',
          deep:    'rgb(var(--background-deep) / <alpha-value>)',
        },
        text: {
          primary:   'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          safe:    'rgb(var(--accent-safe) / <alpha-value>)',
          caution: 'rgb(var(--accent-caution) / <alpha-value>)',
          danger:  'rgb(var(--accent-danger) / <alpha-value>)',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border:  'rgb(var(--border) / <alpha-value>)',
      },
      fontFamily: {
        jakarta: ['PlusJakartaSans', 'system-ui', 'sans-serif'],
      },
    },
  },
} satisfies Config
```
