import { API_ROUTES } from '@schnl/shared/api';
import type {
  UserSearchRequest,
  UserSearchResponse,
} from '@schnl/shared/validators/user-search.validator';
import * as api from '@/services/api';

export async function search(request: UserSearchRequest): Promise<UserSearchResponse> {
  return api.get<UserSearchResponse>(API_ROUTES.users.search(), request);
}
