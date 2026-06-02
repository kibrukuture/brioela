export const USER_ROUTES = {
  base: "/v1/users",

  getAll: () => "/v1/users",

  getById: (id: string) => `/v1/users/by-id/${id}`,

  create: () => "/v1/users",

  update: (id: string) => `/v1/users/by-id/${id}`,

  delete: (id: string) => `/v1/users/by-id/${id}`,

  schnlTag: () => "/v1/users/schnl-tag",

  checkSchnlTag: () => "/v1/users/check-tag",

  updatePrivacy: () => "/v1/users/privacy",

  profilePicture: () => "/v1/users/profile-picture",

  search: () => "/v1/users/search",
  kycLegalNameAndWallet: () => "/v1/users/kyc/legal-name-and-wallet",
} as const;

// ✅ Define patterns (for API router)
export const USER_ROUTE_PATTERNS = {
  me: "/me",
  checkTag: "/check-tag",
  schnlTag: "/schnl-tag",
  updatePrivacy: "/privacy", // Changed from 'privacy' back to 'updatePrivacy'
  profilePicture: "/profile-picture",
  delete: "/by-id/:id",
  getById: "/by-id/:id", // Avoids collision with /search
  search: "/search",
  kycLegalNameAndWallet: "/kyc/legal-name-and-wallet",
} as const;
