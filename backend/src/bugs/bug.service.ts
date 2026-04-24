import { prisma } from '../lib/prisma';
import {
  Bug,
  BugStatus,
  CreateBugInput,
  UpdateBugInput,
  PRISMA_TO_STATUS,
  STATUS_TO_PRISMA,
} from './bug.types';

export class AppError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND',
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Maps a raw Prisma Bug record to the API Bug shape
function mapBug(record: {
  id: string;
  title: string;
  stepsToReproduce: string;
  severity: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Bug {
  return {
    id: record.id,
    title: record.title,
    stepsToReproduce: record.stepsToReproduce,
    severity: record.severity as Bug['severity'],
    status: PRISMA_TO_STATUS[record.status],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listBugs(): Promise<Bug[]> {
  const records = await prisma.bug.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return records.map(mapBug);
}

export async function getBugById(id: string): Promise<Bug> {
  const record = await prisma.bug.findUnique({ where: { id } });
  if (!record) throw new AppError('NOT_FOUND', 'Bug not found');
  return mapBug(record);
}

export async function createBug(data: CreateBugInput): Promise<Bug> {
  const record = await prisma.bug.create({
    data: {
      title: data.title.trim(),
      stepsToReproduce: data.stepsToReproduce.trim(),
      severity: data.severity as any,
      status: 'Open' as any,
    },
  });
  return mapBug(record);
}

export async function updateBug(id: string, data: UpdateBugInput): Promise<Bug> {
  const existing = await prisma.bug.findUnique({ where: { id } });
  if (!existing) throw new AppError('NOT_FOUND', 'Bug not found');

  const payload: Record<string, unknown> = {};
  if (data.title !== undefined)            payload.title = data.title.trim();
  if (data.stepsToReproduce !== undefined) payload.stepsToReproduce = data.stepsToReproduce.trim();
  if (data.severity !== undefined)         payload.severity = data.severity;
  if (data.status !== undefined)           payload.status = STATUS_TO_PRISMA[data.status as BugStatus];

  const record = await prisma.bug.update({ where: { id }, data: payload });
  return mapBug(record);
}

export async function deleteBug(id: string): Promise<void> {
  const existing = await prisma.bug.findUnique({ where: { id } });
  if (!existing) throw new AppError('NOT_FOUND', 'Bug not found');
  await prisma.bug.delete({ where: { id } });
}
