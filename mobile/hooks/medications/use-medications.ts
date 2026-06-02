import { useQuery } from '@tanstack/react-query';
import { medicationsApi } from '@/services/api/medications/medications.api';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useMedications() {
  return useQuery({
    queryKey: QUERY_KEYS.MEDICATIONS.LIST,
    queryFn: medicationsApi.getAll,
  });
}
