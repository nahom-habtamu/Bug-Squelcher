import type { Bug, CreateBugDto, UpdateBugDto } from '../bug.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchBugs(): Promise<Bug[]> {
  const res = await fetch(`${BASE_URL}/api/bugs`);
  return handleResponse<Bug[]>(res);
}

export async function fetchBug(id: string): Promise<Bug> {
  const res = await fetch(`${BASE_URL}/api/bugs/${id}`);
  return handleResponse<Bug>(res);
}

export async function createBug(data: CreateBugDto): Promise<Bug> {
  const res = await fetch(`${BASE_URL}/api/bugs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Bug>(res);
}

export async function updateBug(id: string, data: UpdateBugDto): Promise<Bug> {
  const res = await fetch(`${BASE_URL}/api/bugs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Bug>(res);
}

export async function deleteBug(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/bugs/${id}`, { method: 'DELETE' });
  return handleResponse<void>(res);
}
