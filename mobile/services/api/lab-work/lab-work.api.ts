import { API_ROUTES } from '@schnl/shared/api';
import { UserDocument } from '@schnl/shared/drizzle/schema/user-documents.schema';
import * as api from '@/services/api';

export type PostLabWork = {
  payload: unknown;
};
export async function postLabWork({ payload }: PostLabWork) {
  return api.post(API_ROUTES.documents.post(), payload);
}

type DeleteLabWork = {
  id: string;
};
export async function deleteLabWork({ id }: DeleteLabWork) {
  return api.del(API_ROUTES.documents.delete(id));
}

export async function getAllLabWorks(): Promise<UserDocument[]> {
  return api.get<UserDocument[]>(API_ROUTES.documents.list());
}
