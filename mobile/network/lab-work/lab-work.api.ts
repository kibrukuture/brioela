import { API_ROUTES } from '@brioela/shared/api';
import * as api from '@/network/core';

export type PostLabWork = {
  payload: unknown;
};
export async function postLabWork({ payload }: PostLabWork) {
  return api.post(API_ROUTES.documents.post(), payload);
}
