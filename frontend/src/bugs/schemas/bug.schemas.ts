import { z } from 'zod';

export const severitySchema = z.enum(['P0', 'P1', 'P2', 'P3']);
export const statusSchema = z.enum(['Open', 'In Progress', 'Works on My Machine']);

export const createBugSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  stepsToReproduce: z.string().trim().min(1, 'At least one step is required'),
  severity: severitySchema,
});

export const updateBugSchema = z.object({
  title: z.string().trim().min(1).optional(),
  stepsToReproduce: z.string().trim().min(1).optional(),
  severity: severitySchema.optional(),
  status: statusSchema.optional(),
});

export type CreateBugFormValues = z.infer<typeof createBugSchema>;
export type UpdateBugFormValues = z.infer<typeof updateBugSchema>;
