# Gap snapshot: react-native-passkey (installed, unused)

Target: N/A — dependency only

**Status:** Package present; no auth integration. Not in build-guide auth docs.

**Evidence:** `mobile/package.json` `"react-native-passkey": "^3.4.0"`. `rg passkey mobile/` — zero usage outside package.json. `build-guide/04-auth-and-onboarding/02-sign-in-methods.md` lists Google, Apple, email legacy only.

**Decision required:** Remove unused dependency OR implement passkey sign-in per future security spec. Product spec `21-onboarding.md` specifies Apple/Google only — passkey is not in scope unless explicitly approved.
