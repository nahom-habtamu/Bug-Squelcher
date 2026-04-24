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

export interface CreateBugDto {
  title: string;
  stepsToReproduce: string;
  severity: Severity;
}

export interface UpdateBugDto {
  title?: string;
  stepsToReproduce?: string;
  severity?: Severity;
  status?: BugStatus;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  P0: 'Critical',
  P1: 'High',
  P2: 'Medium',
  P3: 'Low',
};

export const SEVERITY_COLOR: Record<Severity, string> = {
  P0: '#C50F1F',
  P1: '#CA5010',
  P2: '#986F0B',
  P3: '#107C10',
};

export const STATUS_COLUMNS: BugStatus[] = [
  'Open',
  'In Progress',
  'Works on My Machine',
];
