import { apiClient } from '@/services/api/client';
import ApiError, { ApiSuccessResponse, ApiErrorResponse } from '@schnl/shared/types/api';
import type { AxiosResponse } from 'axios';

/**
 * Type-safe GET request that unwraps ApiSuccessResponse
 */
export async function get<T>(url: string, params?: unknown): Promise<T> {
  try {
    const response = await apiClient.get<ApiSuccessResponse<T> | ApiErrorResponse>(url, { params });

    // Check if response contains an error
    if ('error' in response.data) {
      throw new ApiError(response.data);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Type-safe POST request that unwraps ApiSuccessResponse
 */
export async function post<T>(url: string, payload?: unknown): Promise<T> {
  try {
    const response = await apiClient.post<ApiSuccessResponse<T> | ApiErrorResponse>(url, payload);

    // Check if response contains an error
    if ('error' in response.data) {
      throw new ApiError(response.data);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Type-safe PUT request that unwraps ApiSuccessResponse
 */
export async function put<T>(url: string, payload?: unknown): Promise<T> {
  try {
    const response = await apiClient.put<ApiSuccessResponse<T> | ApiErrorResponse>(url, payload);

    // Check if response contains an error
    if ('error' in response.data) {
      throw new ApiError(response.data);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Type-safe PATCH request that unwraps ApiSuccessResponse
 */
export async function patch<T>(url: string, payload?: unknown): Promise<T> {
  try {
    const response = await apiClient.patch<ApiSuccessResponse<T> | ApiErrorResponse>(url, payload);

    // Check if response contains an error
    if ('error' in response.data) {
      throw new ApiError(response.data);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Type-safe DELETE request that unwraps ApiSuccessResponse
 */
export async function del<T>(
  url: string,
  options?: {
    query?: Record<string, string>;
    body?: unknown;
  }
): Promise<T> {
  try {
    const response = await apiClient.delete<ApiSuccessResponse<T> | ApiErrorResponse>(url, {
      params: options?.query,
      data: options?.body,
    });

    // Check if response contains an error

    if ('error' in response.data) {
      throw new ApiError(response.data);
    }
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

/**
 * GET request for binary data (blobs) - returns raw response without JSON unwrapping
 */
export async function getBlob(url: string, params?: unknown): Promise<AxiosResponse<Blob>> {
  try {
    const response = await apiClient.get<Blob>(url, {
      params,
      responseType: 'blob',
    });
    return response;
  } catch (error) {
    throw error;
  }
}
