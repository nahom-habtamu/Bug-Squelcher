export const bugKeys = {
  all: ['bugs'] as const,
  detail: (id: string) => ['bugs', id] as const,
};
