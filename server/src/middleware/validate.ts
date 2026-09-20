import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Invalid input data',
          details: error.errors.map((e) => ({
            field: e.path.filter((p) => p !== 'body' && p !== 'query' && p !== 'params').join('.'),
            message: e.message,
          })),
        });
      }
      return res.status(400).json({ error: 'Bad Request' });
    }
  };
};
