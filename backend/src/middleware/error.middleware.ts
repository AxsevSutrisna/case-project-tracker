import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BusinessRuleError } from '../errors';

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof BusinessRuleError) {
    return res.status(err.statusCode || 409).json({
      error: err.message,
      conflictingEntity: err.conflictingEntity || null,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  console.error('[server error]', err);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Terjadi kesalahan pada server',
  });
}
