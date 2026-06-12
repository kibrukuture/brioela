# Gap snapshot: fda.recall.adapter.ts

Target: `backend/src/jobs/recall/_adapters/fda.recall.adapter.ts`

**Status:** Not in repo. From `brioela-specs/26-personalized-recall-alerts.md` (FDA public API).

**Research required before implementation:** Confirm current FDA openFDA / recall API endpoint and field mapping via official docs — do not guess field names.

---

```typescript
import type { AppContext } from '@/types'
import type { NormalizedRecall } from '../poll.recall.feeds.job'

type FdaRecallRaw = {
  recall_number: string
  product_description: string
  code_info?: string
  reason_for_recall: string
  recall_initiation_date: string
  status: string
  distribution_pattern?: string
  product_quantity?: string
  report_date?: string
}

type FdaApiResponse = {
  results: FdaRecallRaw[]
}

/** Fetch and normalize FDA food recalls. Called by global poll job only. */
export async function fetchFdaRecalls(ctx: AppContext): Promise<NormalizedRecall[]> {
  const url = buildFdaRecallUrl(ctx.env.FDA_RECALL_API_BASE)
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`FDA recall fetch failed: ${response.status}`)
  }

  const body = (await response.json()) as FdaApiResponse

  return body.results.map((row) => normalizeFdaRow(row))
}

function buildFdaRecallUrl(base: string): string {
  return `${base}?search=status:Ongoing&limit=100`
}

function normalizeFdaRow(row: FdaRecallRaw): NormalizedRecall {
  return {
    externalRecallId: row.recall_number,
    source: 'fda',
    productName: row.product_description.trim(),
    upc: extractUpcFromCodeInfo(row.code_info),
    lotNumbers: extractLotNumbers(row.code_info),
    reason: row.reason_for_recall.trim(),
    issuedAt: parseFdaDate(row.recall_initiation_date),
    expiresAt: null,
    rawNoticeUrl: `https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts`,
    rawPayload: { ...row },
    retracted: row.status.toLowerCase() !== 'ongoing',
  }
}

function extractUpcFromCodeInfo(codeInfo: string | undefined): string | null {
  if (!codeInfo) return null
  const upcMatch = codeInfo.match(/\b\d{12,14}\b/)
  return upcMatch?.[0] ?? null
}

function extractLotNumbers(codeInfo: string | undefined): string[] {
  if (!codeInfo) return []
  return codeInfo
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !/^\d{12,14}$/.test(s))
}

function parseFdaDate(raw: string): Date {
  return new Date(raw)
}
```

**EFSA / CFIA / RASFF:** Same `NormalizedRecall` output shape — separate adapter files per source.
