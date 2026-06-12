# Draft: oura.connector.ts (gap — file does not exist)

Target: `mobile/features/wearables/connectors/oura.connector.ts`

**Source:** `build-guide/20-wearables/01-connection-model.md` — Oura API V2/OAuth only (V1 removed)

---

```typescript
import * as AuthSession from 'expo-auth-session'
import type { WearableConnector } from '../types/wearable.connector.types'
import type { WearableDailySummary } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'
import { buildDailySummaryFromOura } from '../helpers/build.daily.summary.helper'

const OURA_AUTH_URL = 'https://cloud.ouraring.com/oauth/authorize'
const OURA_TOKEN_URL = 'https://api.ouraring.com/oauth/token'
const OURA_API_BASE = 'https://api.ouraring.com/v2/usercollection'

type OuraTokens = {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export function createOuraConnector(
  connectionId: string,
  getTokens: () => OuraTokens | null,
  setTokens: (tokens: OuraTokens | null) => void,
): WearableConnector {
  return {
    provider: 'oura',
    connectionKind: 'oauth',
    supportedDataTypes: [
      'sleep',
      'hrv',
      'resting_heart_rate',
      'body_temperature_deviation',
      'activity',
    ],
    async connect(grantedTypes) {
      const redirectUri = AuthSession.makeRedirectUri()
      const result = await AuthSession.startAsync({
        authUrl: `${OURA_AUTH_URL}?client_id=${process.env.EXPO_PUBLIC_OURA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=daily personal`,
      })
      if (result.type !== 'success' || !('params' in result) || !result.params.code) {
        throw new Error('oura_oauth_cancelled')
      }
      const tokenRes = await fetch(OURA_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(result.params.code),
          redirect_uri: redirectUri,
          client_id: process.env.EXPO_PUBLIC_OURA_CLIENT_ID ?? '',
          client_secret: process.env.EXPO_PUBLIC_OURA_CLIENT_SECRET ?? '',
        }),
      })
      if (!tokenRes.ok) throw new Error('oura_token_exchange_failed')
      const tokenJson = (await tokenRes.json()) as {
        access_token: string
        refresh_token: string
        expires_in: number
      }
      setTokens({
        accessToken: tokenJson.access_token,
        refreshToken: tokenJson.refresh_token,
        expiresAt: Date.now() + tokenJson.expires_in * 1000,
      })
      return { connectionId, grantedDataTypes: grantedTypes }
    },
    async disconnect() {
      setTokens(null)
    },
    async buildDailySummary(localDate: string): Promise<WearableDailySummary | null> {
      const tokens = getTokens()
      if (!tokens) return null
      const [sleepRes, readinessRes] = await Promise.all([
        fetch(`${OURA_API_BASE}/daily_sleep?start_date=${localDate}&end_date=${localDate}`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }),
        fetch(`${OURA_API_BASE}/daily_readiness?start_date=${localDate}&end_date=${localDate}`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        }),
      ])
      if (!sleepRes.ok || !readinessRes.ok) return null
      const sleepJson = await sleepRes.json()
      const readinessJson = await readinessRes.json()
      return buildDailySummaryFromOura({
        connectionId,
        localDate,
        sleepJson,
        readinessJson,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    },
  }
}
```

Verify OAuth scopes and endpoint paths against current Oura V2 docs at implementation (G26).
