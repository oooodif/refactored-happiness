import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware for validating request body with Zod schema
 */
export function validateRequest(schema: z.ZodType<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Internal server error during validation' });
    }
  };
}