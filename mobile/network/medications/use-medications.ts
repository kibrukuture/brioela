import { useQuery } from '@tanstack/react-query';
import { medicationsApi } from '@/network/medications/medications.api';
import { QUERY_KEYS } from '@/network/core/query-keys';

export function useMedications() {
  return useQuery({
    queryKey: QUERY_KEYS.MEDICATIONS.LIST,
    queryFn: medicationsApi.getAll,
  });
}
