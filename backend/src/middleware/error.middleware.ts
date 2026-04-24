import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
