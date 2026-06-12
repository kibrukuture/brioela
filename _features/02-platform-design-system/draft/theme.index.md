# Draft: theme/index.ts

Target: `mobile/theme/index.ts`

```typescript
import { DefaultTheme, DarkTheme } from 'expo-router';
import type { Theme } from 'expo-router/react-navigation';

import { COLORS } from './colors';

// SDK 56: these theme objects are consumed by Expo Router's ThemeProvider in app/_layout.tsx.
// Keep runtime theme imports on `expo-router`; see mobile/SDK56-NAVIGATION-NOTES.md.
const NAV_THEME: { light: Theme; dark: Theme } = {
  light: {
    dark: false,
    colors: {
      // for light, i have changed the backogud color
      background: COLORS.white,
      border: COLORS.light.grey5,
      card: COLORS.light.card,
      notification: COLORS.light.destructive,
      primary: COLORS.light.primary,
      text: COLORS.black,
    },
    fonts: DefaultTheme.fonts,
  },
  dark: {
    dark: true,
    colors: {
      background: COLORS.dark.background,
      border: COLORS.dark.grey5,
      card: COLORS.dark.grey6,
      notification: COLORS.dark.destructive,
      primary: COLORS.dark.primary,
      text: COLORS.white,
    },
    fonts: DarkTheme.fonts,
  },
};

export { NAV_THEME };

```
