export const LAB_RESULT_ROUTES = {
  base: "/v1/lab-results",

  getAll: () => "/v1/lab-results",

  getById: (id: string) => `/v1/lab-results/${id}`,

  uploadPdf: () => "/v1/lab-results/upload",

  getTrends: (id: string) => `/v1/lab-results/${id}/trends`,

  delete: (id: string) => `/v1/lab-results/${id}`,
} as const;

// ✅ Define patterns (for API router)
export const LAB_RESULT_ROUTE_PATTERNS = {
  getAll: "/",
  getById: "/:id",
  uploadPdf: "/upload",
  getTrends: "/:id/trends",
  delete: "/:id",
} as const;
