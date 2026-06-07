# 20. Platform and App Distribution

## Goal

Define what Brioela is at the platform level, how it is distributed, and what platform capabilities it depends on to deliver its core experience.

## Platform Targets

### Native iOS App (Primary)
- The primary product surface. Camera, microphone, background audio, push notifications, and share sheet extensions require native runtime.
- Built with React Native (cross-platform with Android) or Swift (iOS-only first).
- Distributed via Apple App Store.

### Native Android App (Primary, close second)
- Same feature parity as iOS.
- Built with React Native (shared codebase) or Kotlin.
- Distributed via Google Play Store.

### PWA (Web — Secondary)
- Serves users who discover Brioela via shared content or links before downloading the app.
- Limited feature set: product scanning via web camera, recipe viewing, map, community notes.
- Does not support live voice sessions (PWA microphone/audio APIs are too limited for full-duplex real-time sessions at required quality).
- Acts as a conversion surface: users who find the product via PWA are prompted to download the native app for the full experience.
- No App Store gating — accessible immediately via browser.

## Critical Platform Capabilities and How Brioela Uses Them

### Camera
- Barcode scanning: real-time on-device detection before any server call.
- Label/product image: full image sent to server for GPT-4o mini vision extraction when barcode fails.
- Fridge/pantry view: camera opened to a frame capture mode, one or more frames sent for ingredient detection.
- Live cooking vision: continuous low-rate frame capture sent to Gemini Live WebSocket (premium sessions only).
- Receipt capture: single frame sent for GPT-4o mini vision extraction.
- The camera experience must open in under 500ms on any recent device. Delay here is the entire first impression.

### Microphone
- Voice cooking agent: real-time audio input sent to Gemini Live WebSocket.
- Multi-person rooms: audio/video transport through Cloudflare Realtime / RealtimeKit.
- Passive detection of travel intent and contextual signals: only from explicit voice interactions, never background microphone access.
- Microphone is never open passively. It activates only on explicit user gesture.

### Share Sheet Extension
- The single most important distribution mechanism after organic scanning.
- iOS/Android share sheet extension intercepts shared content from TikTok, YouTube, Instagram, Safari, and any browser.
- User shares a food video or URL → Brioela appears in the share sheet → one tap → import begins.
- The extension must launch the import job immediately (background process) and confirm to the user within 2 seconds that the recipe is being processed.
- The user does not need to have Brioela open to share to it. Extension works from background.

### Push Notifications
- Used sparingly — governed by the ambient notification strategy in spec 23.
- Permission requested only after the user has received value from the app (not at first launch).
- Categories: allergy warnings (critical), price alerts (low, batched), weekly summary, cooking session invites, recipe capture complete.

### Background Audio
- Required for the voice cooking agent during active sessions.
- The app must maintain the Gemini Live WebSocket and audio output when the screen is locked or another app is foregrounded.
- Classified as a cooking assistant session for platform background audio permissions.

### Location
- Used for: community note geo-scoping, healthy food map, hyperlocal price alerts, pre-trip intelligence.
- Requested at the point of first map or scan interaction that needs it, not at app install.
- Coarse location is sufficient for most features. Precise location is only requested for navigation handoff to a maps app.

## App Store Strategy

### iOS App Store
- Category: Health & Fitness (primary), Food & Drink (secondary).
- Search keywords: barcode food scanner, healthy food finder, cooking assistant, recipe organizer, food community.
- Apple Search Ads: run on "food scanner", "barcode scanner healthy", "personal CRM food" intent keywords once the product is live.
- Privacy label: camera, microphone, location (when-in-use), health and fitness data (food preferences, allergy data — stored on device/private cloud, not shared).

### Google Play Store
- Same category strategy as iOS.
- Leverage Google's food and health app promotion surfaces.

## App Size and Performance Targets

- Initial install size: under 40MB for iOS, under 50MB for Android.
- Cold launch to camera-ready: under 1.5 seconds.
- First scan verdict: under 3 seconds total from camera open to result displayed (spec 01 requirement).
- Voice session audio-to-first-response: target under 600ms end-to-end.

## PWA Technical Notes

- Served from Cloudflare Workers (same codebase as API).
- Service worker for offline recipe viewing and scan history browsing.
- Web camera API for basic scanning on desktop and recent Android browsers.
- Does not use the share target API for recipe import on iOS (iOS PWA share sheet support is limited — iOS users must use the native app for share sheet import).

## Success Metrics

- App Store install rate from product page visits.
- Share sheet import completion rate (how many people who share a video actually complete an import).
- iOS vs Android vs PWA session distribution.
- Camera open-to-result latency in production (p50 and p95).
- Background audio session survival rate (sessions not dropped by OS when screen locks).
