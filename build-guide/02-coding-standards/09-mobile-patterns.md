# Mobile — Component and Hook Patterns

## Screen Files Are Thin

Files inside `mobile/app/` (Expo Router) contain screens. Screens are thin — they compose feature components, pass props, and handle navigation. No business logic, no data fetching, no state management lives inside a screen file.

```tsx
// mobile/app/(tabs)/index.tsx — scan screen
import { ScanView } from '@/features/scanner'

export default function ScanScreen() {
  // Screen does nothing except render the feature root component
  return <ScanView />
}
```

If a screen file exceeds 40 lines, business logic is leaking in. Extract it.

---

## Feature Root Component

Each feature has a root component — the entry point rendered by the screen. It owns: layout structure, feature-level state, coordination between sub-components.

```tsx
// mobile/src/features/scanner/components/ScanView.tsx
import { View } from 'react-native'
import { AmbientCanvas } from '@/components/AmbientCanvas'
import { GlowRing } from '@/components/GlowRing'
import { VerdictCard } from './VerdictCard'
import { useScanner } from '../hooks/useScanner'

export function ScanView() {
  const { state, onBarcodeDetected, verdict } = useScanner()

  return (
    <View className="flex-1 bg-bg-primary">
      <AmbientCanvas intensity={state === 'idle' ? 0.3 : 0.6} />
      <GlowRing state={state} />
      {verdict && <VerdictCard verdict={verdict} />}
    </View>
  )
}
```

---

## Hooks Own Logic

Custom hooks own all logic that is not pure rendering. Data fetching, state machines, animation values, side effects, event handlers — all in hooks.

```ts
// mobile/src/features/scanner/hooks/useScanner.ts
import { useState } from 'react'
import { useSharedValue, withSpring } from 'react-native-reanimated'
import { useIsomorphicLayoutEffect } from 'usehooks-ts'
import { haptic } from '@/design-system/haptics'
import { spring } from '@/design-system/motion'
import { useScanQuery } from './useScanQuery'
import type { ScanVerdict } from '@brioela/shared'

type ScannerState = 'idle' | 'detecting' | 'locked' | 'result'

export function useScanner() {
  const [state, setState] = useState<ScannerState>('idle')
  const [verdict, setVerdict] = useState<ScanVerdict | null>(null)
  const ringProgress = useSharedValue(0)

  const { mutateAsync: scanUpc } = useScanQuery()

  const onBarcodeDetected = async (upc: string) => {
    setState('locked')
    ringProgress.value = withSpring(1, spring.snap)
    haptic.impact.rigid()

    const result = await scanUpc(upc)
    setVerdict(result.verdict)
    haptic.verdict[result.verdict.level]()
    setState('result')
  }

  return { state, verdict, ringProgress, onBarcodeDetected }
}
```

**Every effect hook uses `useIsomorphicLayoutEffect` from `usehooks-ts`.** Never `useEffect` or `useLayoutEffect` directly.

---

## TanStack Query for All Server State

All API calls go through TanStack Query. No `useEffect` + `fetch`. No `useState` for server data.

```ts
// mobile/src/features/scanner/hooks/useScanQuery.ts
import { useMutation } from '@tanstack/react-query'
import { scanApi } from '@/api'

export function useScanQuery() {
  return useMutation({
    mutationFn: (upc: string) => scanApi.scanUpc(upc),
  })
}

// mobile/src/features/recipes/hooks/useRecipes.ts
import { useQuery } from '@tanstack/react-query'
import { recipesApi } from '@/api'

export function useRecipes() {
  return useQuery({
    queryKey: ['recipes'],
    queryFn:  () => recipesApi.listRecipes(),
    staleTime: 1000 * 60 * 5,  // 5 minutes
  })
}
```

Query keys are arrays. The first element is the domain string, subsequent elements narrow the query:

```ts
queryKey: ['recipes']                        // all recipes
queryKey: ['recipes', recipeId]              // one recipe
queryKey: ['scan', 'history']                // scan history
queryKey: ['ground', 'finds', geohash]       // finds in a geohash cell
```

---

## Component File Pattern

Every shared component lives in its own folder. The folder contains the component, its test file, and the barrel export. Nothing else.

```
mobile/src/components/Button/
├── Button.tsx      — the component
├── Button.test.tsx — tests (if any)
└── index.ts        — barrel: export { Button } from './Button'
```

The component file:

```tsx
// mobile/src/components/Button/Button.tsx
import { Pressable, Text } from 'react-native'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/design-system/variants/button'
import { haptic } from '@/design-system/haptics'

type ButtonProps = VariantProps<typeof buttonVariants> & {
  label: string
  onPress: () => void
  disabled?: boolean
  className?: string
}

export function Button({ variant, size, label, onPress, disabled, className }: ButtonProps) {
  const handlePress = () => {
    haptic.impact.medium()
    onPress()
  }

  return (
    <Pressable
      className={cn(buttonVariants({ variant, size }), disabled && 'opacity-40', className)}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text className="font-jakarta text-label-lg font-semibold text-text-inverse">
        {label}
      </Text>
    </Pressable>
  )
}
```

---

## No Direct API Calls in Components

Components never call `fetch` or make HTTP requests. They call hooks. Hooks call the API layer. The API layer calls the server.

```tsx
// ✗ — API call directly in component
function RecipeList() {
  const [recipes, setRecipes] = useState([])
  useEffect(() => {
    fetch('/api/recipes').then(r => r.json()).then(setRecipes)
  }, [])
}

// ✓ — hook owns the data, component consumes it
function RecipeList() {
  const { data: recipes, isLoading } = useRecipes()
  if (isLoading) return <RecipeListSkeleton />
  return recipes?.map(r => <RecipeCard key={r.id} recipe={r} />)
}
```

---

## State Management Principles

| Data type | Tool |
|---|---|
| Server data (from API) | TanStack Query |
| Global UI state (auth, theme, ambient intensity) | Zustand store — one store per concern |
| Feature-local state | `useState` in the feature hook |
| Animation values | Reanimated `useSharedValue` |
| Form state | Controlled `useState` — no form library |

No prop drilling past two levels. If a value needs to go three or more levels deep, it goes into Zustand or a React context.

---

## Zustand Store Pattern

One file per store. Stores are in `mobile/src/providers/` if they need a React context bridge, or directly in the feature if feature-local.

```ts
// mobile/src/providers/ambient-store.ts
import { create } from 'zustand'

type AmbientStore = {
  intensity: number
  setIntensity: (v: number) => void
}

export const useAmbientStore = create<AmbientStore>((set) => ({
  intensity: 0.3,
  setIntensity: (intensity) => set({ intensity }),
}))
```

---

## Accessibility on Every Interactive Element

Every `Pressable`, `TouchableOpacity`, and interactive component declares:

```tsx
<Pressable
  accessibilityRole="button"        // required
  accessibilityLabel="Scan product" // required if icon-only
  accessibilityHint="Tap to scan the barcode" // optional but valuable
  accessible={true}
/>
```

No interactive element is without `accessibilityRole`. VoiceOver and TalkBack users depend on it.
