export const QUEUE_ROUTES = {
  base: "/v1/queue",

  // those are features.
  medications: "/v1/queue/medications",
  biomarkers: "/v1/queue/biomarkers",
  observations: "/v1/queue/observations",
  "document-extraction-logs": "/v1/queue/document-extraction-logs",
  "document-staging": "/v1/queue/document-staging",
  "health-records": "/v1/queue/health-records",
  documents: "/v1/queue/documents",
  email: "/v1/queue/email",
  "lab-work": "/v1/queue/lab-work",

  "align.polling.eventsEndpoint": "/v1/queue/align/events",

  "temp.base": "/v1/temp-pingers",
  "temp.upstash": "/v1/temp-pingers/upstash",
  "temp.supabase": "/v1/temp-pingers/supabase",

  // labworkd
  "lab-work.extract-text": "/v1/queue/lab-work/extract-text",
  "lab-work.detect-language": "/v1/queue/lab-work/detect-language",
  "lab-work.extract-biomarkers": "/v1/queue/lab-work/extract-biomarkers",
  "lab-work.standardize-units": "/v1/queue/lab-work/standardize-units",

  // banking
  "banking.pay-request-expire": "/v1/queue/banking/pay-requests/expire",
  "banking.pay-request-execute-payout":
    "/v1/queue/banking/pay-requests/execute-payout",
  "banking.outgoing-payout-execute":
    "/v1/queue/banking/outgoing-payouts/execute",
  "banking.peer-to-peer-execute": "/v1/queue/banking/peer-to-peer/execute",
  "banking.offramp-outbox-process": "/v1/queue/banking/offramp-outbox/process",
} as const;

// ✅ Define patterns (for API router)
export const QUEUE_ROUTE_PATTERNS = {
  medications: "/medications",
  biomarkers: "/biomarkers",
  observations: "/observations",
  "document-extraction-logs": "/document-extraction-logs",
  "document-staging": "/document-staging",
  "health-records": "/health-records",
  documents: "/documents",
  "lab-work": "/lab-work",
  email: "/email",

  "temp.upstash": "/upstash",
  "temp.supabase": "/supabase",

  // labwork
  "lab-work.extract-text": "/lab-work/extract-text",
  "lab-work.detect-language": "/lab-work/detect-language",
  "lab-work.extract-biomarkers": "/lab-work/extract-biomarkers",
  "lab-work.standardize-units": "/lab-work/standardize-units",

  // polling
  "align.polling.provider": "/align",
  "align.polling.events": "/events",

  // banking
  "banking.pay-request-expire": "/banking/pay-requests/expire",
  "banking.pay-request-execute-payout": "/banking/pay-requests/execute-payout",
  "banking.outgoing-payout-execute": "/banking/outgoing-payouts/execute",
  "banking.peer-to-peer-execute": "/banking/peer-to-peer/execute",
  "banking.offramp-outbox-process": "/banking/offramp-outbox/process",
} as const;

export const POLLING_ROUTES = {
  base: "/v1/polling",

  "align.eventsEndpoint": "/v1/polling/align/events",
} as const;
