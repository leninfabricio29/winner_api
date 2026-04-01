import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../utils/jwt';

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ApiError(401, 'No autenticado'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'No tiene permisos para esta accion'));
    }

    next();
  };
};
