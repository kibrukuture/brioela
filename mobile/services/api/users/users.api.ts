import { API_ROUTES } from '@schnl/shared/api';
import { User } from '@schnl/shared/drizzle/schema/user.schema';
import { CheckSchnlTagResponse, KycLegalNameInput } from '@schnl/shared/validators/user.validator';
import type {
  UserSearchRequest,
  UserSearchResponse,
} from '@schnl/shared/validators/user-search.validator';
import type { UpdateProfilePictureResponse } from '@schnl/shared/validators/profile-picture.validator';
import * as api from '@/services/api';

export async function deleteUser(id: string) {
  return api.del(API_ROUTES.users.delete(id));
}

export async function getUserById(userId: string): Promise<User> {
  return api.get<User>(API_ROUTES.users.getById(userId));
}

export async function setSchnlTag(data: { schnlTag: string }) {
  return api.post<User>(API_ROUTES.users.schnlTag(), data);
}

export async function checkSchnlTag(tag: string) {
  return api.get<CheckSchnlTagResponse>(API_ROUTES.availability.checkSchnlTag(), {
    tag,
  });
}

export async function updatePrivacy(data: { isDiscoverable: boolean }) {
  return api.patch<User>(API_ROUTES.users.updatePrivacy(), data);
}

export async function updateProfilePicture(
  formData: FormData
): Promise<UpdateProfilePictureResponse> {
  return api.patch<UpdateProfilePictureResponse>(API_ROUTES.users.profilePicture(), formData);
}

export async function kycLegalNameAndWallet(data: KycLegalNameInput) {
  return api.post<User>(API_ROUTES.users.kycLegalNameAndWallet(), data);
}

export async function searchUsers(request: UserSearchRequest): Promise<UserSearchResponse> {
  return api.get<UserSearchResponse>(API_ROUTES.users.search(), request);
}
