import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { errorResponse } from '../utils/apiResponse';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields: Record<string, string> = {};
      (result.error as ZodError).issues.forEach((issue) => {
        const key = issue.path.join('.');
        fields[key] = issue.message;
      });
      errorResponse(res, 422, 'VALIDATION_ERROR', 'Request validation failed', fields);
      return;
    }
    // Replace the raw input with validated (and potentially transformed) data
    (req as unknown as Record<string, unknown>)[source] = result.data;
    next();
  };
}
