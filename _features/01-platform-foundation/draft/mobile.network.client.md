# Draft: mobile.network.client

Target: `mobile/network/core/client.ts`

```
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/account/use-auth-store';
import { PUBLIC_URLS } from '@brioela/shared/constants';
import ApiError, { ApiErrorResponse } from '@brioela/shared/types/api';

export const apiClient = axios.create({
  baseURL: PUBLIC_URLS.PUBLIC_API_BASE_URL,
  timeout: 30_000,
});

const MAX_NETWORK_RETRIES = 2;
const NETWORK_RETRY_BASE_DELAY_MS = 300;

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
  async (error) => {
    const rawConfig: InternalAxiosRequestConfig | undefined = error.config;

    // React Native should keep Axios' default adapter. The p2p app uses fetch because it runs on the web.
    const isNetworkError = error.code === 'ERR_NETWORK' && !error.response;
    if (isNetworkError && rawConfig) {
      const rawRetry = Reflect.get(rawConfig, '_retryCount');
      const retryCount = typeof rawRetry === 'number' ? rawRetry : 0;

      if (retryCount < MAX_NETWORK_RETRIES) {
        Reflect.set(rawConfig, '_retryCount', retryCount + 1);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, NETWORK_RETRY_BASE_DELAY_MS * (retryCount + 1));
        });

        return apiClient(rawConfig);
      }
    }

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
```
