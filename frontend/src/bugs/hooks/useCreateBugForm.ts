import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBug } from '../api/bugs.api';
import { bugKeys } from './bugKeys';
import { createBugSchema, type CreateBugFormValues } from '../schemas/bug.schemas';

export function useCreateBugForm(onSuccess: () => void) {
  const queryClient = useQueryClient();

  const form = useForm<CreateBugFormValues>({
    resolver: zodResolver(createBugSchema),
    defaultValues: { title: '', stepsToReproduce: '', severity: 'P2' },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateBugFormValues) => createBug(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bugKeys.all });
      form.reset();
      onSuccess();
    },
  });

  const onSubmit = form.handleSubmit((data) => mutation.mutate(data));

  return {
    ...form,
    onSubmit,
    isSubmitting: mutation.isPending,
    submitError: mutation.error?.message,
  };
}
