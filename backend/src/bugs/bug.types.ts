export type Severity = 'P0' | 'P1' | 'P2' | 'P3';
export type BugStatus = 'Open' | 'In Progress' | 'Works on My Machine';

export interface Bug {
  id: string;
  title: string;
  stepsToReproduce: string;
  severity: Severity;
  status: BugStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBugInput {
  title: string;
  stepsToReproduce: string;
  severity: Severity;
}

export interface UpdateBugInput {
  title?: string;
  stepsToReproduce?: string;
  severity?: Severity;
  status?: BugStatus;
}

// Mapping: API display string → Prisma storage value
export const STATUS_TO_PRISMA: Record<BugStatus, string> = {
  'Open': 'Open',
  'In Progress': 'InProgress',
  'Works on My Machine': 'WorksOnMyMachine',
};

// Mapping: Prisma storage value → API display string
export const PRISMA_TO_STATUS: Record<string, BugStatus> = {
  'Open': 'Open',
  'InProgress': 'In Progress',
  'WorksOnMyMachine': 'Works on My Machine',
};
