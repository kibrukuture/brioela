export const STRESS_TEST_ROUTES = {
  base: "/v1/stress-test",

  detectLanguage: "/v1/stress-test/detect-language",
  extractBiomarkers: "/v1/stress-test/extract-biomarkers",
  classifyDocument: "/v1/stress-test/classify-document",
  standardizeUnits: "/v1/stress-test/standardize-units",
  extractText: "/v1/stress-test/extract-text",
  createCustomer: "/v1/stress-test/create-customer",
  getCustomer: "/v1/stress-test/get-customer",
  getKycLink: "/v1/stress-test/get-kyc-link",
  sendPush: "/v1/stress-test/send-push",
  sendOneSignal: "/v1/stress-test/send-onesignal",
  sendTestEmail: "/v1/stress-test/send-test-email",

  //   sentry test
  testSentry: "/v1/stress-test/test-sentry",

  //
  "vector-search": "/v1/stress-test/vector-search",

  "migrate-vectors": "/v1/internal/vectorize-upload",
} as const;

// ✅ Define patterns (for API router)
export const STRESS_TEST_ROUTE_PATTERNS = {
  detectLanguage: "/detect-language",
  extractBiomarkers: "/extract-biomarkers",
  classifyDocument: "/classify-document",
  standardizeUnits: "/standardize-units",
  extractText: "/extract-text",
  createCustomer: "/create-customer",
  getCustomer: "/get-customer",
  getKycLink: "/get-kyc-link",
  sendPush: "/send-push",
  sendOneSignal: "/send-onesignal",
  sendTestEmail: "/send-test-email",
  testSentry: "/test-sentry",
  "vector-search": "/vector-search",
  "migrate-vectors": "/vectorize-upload",
} as const;
