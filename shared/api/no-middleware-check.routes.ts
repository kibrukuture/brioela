export const ENDPOINTS_WITH_NO_AUTH_MIDDLEWARE: string[] = [
  // BUT STILL INTERNAL SIGNATURE VERIFICATION IS NEEDED
  "/v1/webhooks/*",
  "/v1/queue/*",
  "/v1/health",
  "/v1/temp-pingers/*",
  "/v1/auth/*",
  "/v1/stress-test/*",
  "/v1/in-app-notifications/ws",
];
