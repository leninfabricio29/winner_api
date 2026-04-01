import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyJwt } from '../utils/jwt';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Token requerido'));
  }

  const token = header.replace('Bearer ', '').trim();

  try {
    req.user = verifyJwt(token);
    next();
  } catch (error) {
    next(new ApiError(401, 'Token invalido'));
  }
};
