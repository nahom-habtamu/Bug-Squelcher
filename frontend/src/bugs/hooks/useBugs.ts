import { useQuery } from '@tanstack/react-query';
import { fetchBugs } from '../api/bugs.api';
import { bugKeys } from './bugKeys';

export function useBugs() {
  return useQuery({
    queryKey: bugKeys.all,
    queryFn: fetchBugs,
  });
}
