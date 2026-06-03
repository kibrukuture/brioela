import axios from 'axios';
import { API_ROUTES } from '@brioela/shared/api';

export const medicationsApi = {
  getAll: () => axios.get(API_ROUTES.medications.getAll()),
  getById: (id: string) => axios.get(API_ROUTES.medications.getById(id)),
  create: (data: any) => axios.post(API_ROUTES.medications.create(), data),
};
