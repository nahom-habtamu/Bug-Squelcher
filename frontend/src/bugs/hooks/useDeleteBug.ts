import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteBug } from '../api/bugs.api';
import { bugKeys } from './bugKeys';

export function useDeleteBug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBug(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bugKeys.all });
    },
  });
}
