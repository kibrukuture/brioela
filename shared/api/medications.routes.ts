export const MEDICATION_ROUTES = {
  base: "/v1/medications",

  getAll: () => "/v1/medications",

  getById: (id: string) => `/v1/medications/${id}`,

  create: () => "/v1/medications",

  uploadImage: (id: string) => `/v1/medications/${id}/upload`,

  delete: (id: string) => `/v1/medications/${id}`,

  getReminders: (id: string) => `/v1/medications/${id}/reminders`,
} as const;
