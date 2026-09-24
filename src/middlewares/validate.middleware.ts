import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(AppError.badRequest(`Validation failed: ${issues}`, 'VALIDATION_ERROR'));
      } else {
        next(error);
      }
    }
  };
};
