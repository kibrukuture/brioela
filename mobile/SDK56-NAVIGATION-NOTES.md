SDK 56 Navigation Notes

Expo SDK 56 changed how Expo Router relates to React Navigation. Expo Router now owns/forks the navigation pieces it needs internally, so app code should use Expo Router entry points instead of old React Navigation package paths or old custom navigator glue.

Relevant Expo docs:
- SDK 56 release notes: https://expo.dev/changelog/sdk-56
- SDK 55 to 56 Expo Router migration: https://docs.expo.dev/router/migrate/sdk-55-to-56/
- JavaScript tabs: https://docs.expo.dev/router/advanced/tabs/
- Native tabs: https://docs.expo.dev/router/advanced/native-tabs/

What this app uses now:
- Root stack and theme provider come from `expo-router`.
- The main tab layout uses `NativeTabs` from `expo-router/unstable-native-tabs`.
- Do not reintroduce the old `@bottom-tabs/react-navigation` wrapper for the main Expo Router tabs layout.

Why we use `NativeTabs` here:
- The old tab setup was trying to use native/system tab behavior.
- Expo Router's documented SDK 56 native tab path is `NativeTabs`.
- `NativeTabs` supports native icon props such as `sf` for iOS SF Symbols and `md` for Android Material icons.

When to use `Tabs` instead:
- Use `Tabs` from `expo-router` if we want JavaScript tabs and maximum custom styling/control.
- Use `NativeTabs` if we want platform-native tab behavior and system tab appearance.

Important caveat:
- `NativeTabs` is documented by Expo as alpha/unstable. It is the official native-tabs path, but its API may change.
