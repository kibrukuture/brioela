# iOS Simulator / Device destination errors (Expo + Xcode)

## What happened / common error

You may see an error like:

```text
xcodebuild: error: Unable to find a destination matching the provided destination specifier:
{ id:6BDCC117-B5D5-472C-8A7D-101D442C4D77 }

Available destinations for the "Schnl" scheme:
  { platform:iOS Simulator, id:..., name:iPhone 16e }
  ...
```

This means **Xcode cannot find the destination ID (UDID)** that was passed to `xcodebuild`.

Most commonly, this happens after:

- Updating Xcode
- Installing/removing simulators
- Resetting simulators
- Expo/CLI caching or selecting an **old simulator UDID** that no longer exists

## Why it happened in this repo

In this repo the iOS script is:

```json
"ios": "cross-env NODE_ENV=development expo run:ios"
```

When the CLI chooses a destination interactively, it can sometimes pass a simulator UDID that is no longer valid.

## Confirm your Xcode toolchain is correct

After updating Xcode, confirm your terminal is using the correct developer directory:

```sh
xcode-select -p
xcodebuild -version
```

Expected output looks like:

```text
/Applications/Xcode.app/Contents/Developer
Xcode 26.2
...
```

If this is wrong, the destination list can differ from what you see in Xcode’s UI.

## Get available simulator + device IDs (UDIDs)

### Option A (recommended): show destinations for your scheme

This prints the exact destinations Xcode can build to for this workspace/scheme:

```sh
xcodebuild -workspace ios/Schnl.xcworkspace -scheme Schnl -showdestinations
```

Look for entries like:

```text
{ platform:iOS Simulator, id:CAB30E42-010E-40A8-8E87-0DBBE59C7EE1, OS:18.3.1, name:iPhone 16e }
{ platform:iOS, id:00008130-000458AC2EF8001C, name:iPhone }
```

- `platform:iOS Simulator` entries are simulators
- `platform:iOS` entries are physical devices (when connected)

### Option B: list simulators via simctl

```sh
xcrun simctl list devices
```

Tip: UDIDs are the long UUIDs in parentheses.

## How to run on a specific iOS Simulator

### Important: this Expo CLI uses `--device` (not `--simulator`)

On this machine, `npx expo run:ios --help` shows the supported destination flag is:

- `-d, --device [device]` (device name or UDID)

So **you run simulators by passing the simulator name or UDID to `--device`.**

### Best option: pass the simulator UDID (most reliable)

Example (iPhone 16e):

```sh
npx expo run:ios --device "CAB30E42-010E-40A8-8E87-0DBBE59C7EE1"
```

### Alternate: pass the simulator name

If you don’t have duplicates with the same name:

```sh
npx expo run:ios --device "iPhone 16e"
```

## How to run on a physical iPhone

1. Plug in the iPhone and trust the computer.
2. Confirm it appears in `-showdestinations` as `platform:iOS`.
3. Run with the device UDID:

```sh
npx expo run:ios --device "00008130-000458AC2EF8001C"
```

## Why the “magic” command worked

The command worked because:

- The UDID you passed (`CAB30E42-...`) **exists** in Xcode’s available destinations.
- Expo forwarded that destination to `xcodebuild`, so Xcode could actually match it.

Whereas the failing runs were passing IDs like `6BDCC117-...` / `34CC3D9F-...` which were **not** present in `-showdestinations`.

## If you see this again

Work top-down:

1. Confirm Xcode selection:

   ```sh
   xcode-select -p
   xcodebuild -version
   ```

2. List destinations:

   ```sh
   xcodebuild -workspace ios/Schnl.xcworkspace -scheme Schnl -showdestinations
   ```

3. Pick a `platform:iOS Simulator` entry and copy its `id`.

4. Run using that UDID:

   ```sh
   npx expo run:ios --device "<SIMULATOR_UDID>"
   ```

## If the build fails with QuickCrypto / NEON

You may see an error like:

```text
Pods/QuickCrypto: Module '_Builtin_intrinsics.arm.neon' requires feature 'neon'
...
CommandError: Failed to build iOS project. "xcodebuild" exited with error code 65.
```

### What this means

- `react-native-quick-crypto` includes native code that expects **ARM (NEON)**.
- If Xcode is building for an **x86_64 iOS Simulator**, that target does not support NEON.
- This often appears right after an Xcode / Simulator runtime update if your simulator runtime/devices are being treated as `arch:x86_64`.

You can confirm this by running:

```sh
xcodebuild -workspace ios/Schnl.xcworkspace -scheme Schnl -showdestinations
```

If your simulator destinations show `arch:x86_64`, this error is expected with QuickCrypto.

### Fix without touching native repo files

1. Make sure you are using Apple Silicon Simulator runtimes
   - Open **Xcode**
   - Go to **Xcode > Settings (Preferences) > Platforms**
   - Install/reinstall the iOS Simulator runtime you want to use
   - If the runtime looks corrupted or incomplete, remove it and install again

2. Make sure Xcode/Simulator is not running under Rosetta
   - Quit **Xcode** and **Simulator**
   - In Finder:
     - `/Applications/Xcode.app` → Get Info → ensure **Open using Rosetta** is OFF
     - `/Applications/Simulator.app` → Get Info → ensure **Open using Rosetta** is OFF (if present)

3. Create a fresh simulator device
   - Open **Simulator.app**
   - Use **Device > Manage Devices...**
   - Delete the failing simulator device and create a new one (same model + iOS runtime)

4. Re-run with a known good simulator UDID

   ```sh
   npx expo run:ios --device "<SIMULATOR_UDID>"
   ```

5. If you cannot get an arm64 simulator runtime/device right now

   Use a physical iPhone destination instead (still no native repo changes):

   ```sh
   xcodebuild -workspace ios/Schnl.xcworkspace -scheme Schnl -showdestinations
   npx expo run:ios --device "<PHYSICAL_DEVICE_UDID>"
   ```

## Notes

- Using the UDID is safer than using the simulator name because you can have duplicates (multiple “iPhone 16” entries, etc.).
- If you run via Bun scripts, make sure arguments are forwarded correctly (Bun sometimes requires `--` depending on how you call it).
