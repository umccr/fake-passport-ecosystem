import { NextFunction, Request, Response } from 'express';

export function getAuthUser(req: Request, res: Response, next: NextFunction): string {
  // insert some checks here - these should always be true but we can check again..
  return (req as any).user.sub;
}
