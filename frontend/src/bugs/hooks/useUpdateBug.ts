import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBug } from '../api/bugs.api';
import { bugKeys } from './bugKeys';
import type { UpdateBugDto } from '../bug.types';

export function useUpdateBug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBugDto }) =>
      updateBug(id, data),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: bugKeys.all });
      queryClient.invalidateQueries({ queryKey: bugKeys.detail(id) });
    },
  });
}
