export const DOCUMENT_ROUTES = {
  base: "/v1/documents",

  list: () => "/v1/documents",

  get: (id: string) => `/v1/documents/${id}`,

  post: () => "/v1/documents/upload",

  update: (id: string) => `/v1/documents/${id}`,

  delete: (id: string) => `/v1/documents/${id}`,
} as const;

// ✅ Define patterns (for API router)
export const DOCUMENT_ROUTE_PATTERNS = {
  list: "/",
  get: "/:id",
  post: "/upload",
  update: "/:id",
  delete: "/:id",
} as const;
