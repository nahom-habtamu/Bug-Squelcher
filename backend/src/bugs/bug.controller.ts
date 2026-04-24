import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError, listBugs, getBugById, createBug, updateBug, deleteBug } from './bug.service';

const severityEnum = z.enum(['P0', 'P1', 'P2', 'P3']);
const statusEnum   = z.enum(['Open', 'In Progress', 'Works on My Machine']);

const createBugSchema = z.object({
  title:            z.string().trim().min(1, 'Title is required'),
  stepsToReproduce: z.string().trim().min(1, 'Steps to reproduce are required'),
  severity:         severityEnum,
});

const updateBugSchema = z.object({
  title:            z.string().trim().min(1).optional(),
  stepsToReproduce: z.string().trim().min(1).optional(),
  severity:         severityEnum.optional(),
  status:           statusEnum.optional(),
}).refine(
  (data) => Object.keys(data).some((k) => data[k as keyof typeof data] !== undefined),
  { message: 'At least one field must be provided' }
);

export async function handleListBugs(req: Request, res: Response, next: NextFunction) {
  try {
    const bugs = await listBugs();
    res.json(bugs);
  } catch (err) {
    next(err);
  }
}

export async function handleGetBugById(req: Request, res: Response, next: NextFunction) {
  try {
    const bug = await getBugById(req.params.id);
    res.json(bug);
  } catch (err) {
    if (err instanceof AppError && err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

export async function handleCreateBug(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createBugSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const bug = await createBug(parsed.data);
    res.status(201).json(bug);
  } catch (err) {
    next(err);
  }
}

export async function handleUpdateBug(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateBugSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }
    const bug = await updateBug(req.params.id, parsed.data);
    res.json(bug);
  } catch (err) {
    if (err instanceof AppError && err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

export async function handleDeleteBug(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteBug(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err instanceof AppError && err.code === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}
