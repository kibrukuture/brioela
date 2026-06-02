import axios from 'axios';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { PUBLIC_URLS } from '@schnl/shared/constants';
import ApiError, { ApiErrorResponse } from '@schnl/shared/types/api';

export const apiClient = axios.create({
  baseURL: PUBLIC_URLS.PUBLIC_API_BASE_URL,
});

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().session?.access_token;
  const userId = useAuthStore.getState().user?.id;

  //   Add auth token to every request
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔹 Add userId as query param (if available)
  if (userId) {
    // Ensure params object exists
    config.params = config.params || {};
    config.params.userId = userId;
  }

  // 👇 Only set JSON header *if* data is a plain object (not FormData)
  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Parse ApiErrorResponse from backend
    const apiError = error.response?.data as ApiErrorResponse | undefined;

    if (apiError?.error) {
      const typedError = new ApiError(apiError);

      // Handle 401
      if (error.response?.status === 401) {
      }

      return Promise.reject(typedError);
    }

    // Fallback for non-API errors
    if (error.response?.status === 401) {
    }

    return Promise.reject(error);
  }
);
