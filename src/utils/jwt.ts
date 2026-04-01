import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type UserRole = 'super_admin' | 'business' | 'client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const signJwt = (payload: JwtPayload): string => {
  const expiresIn = env.jwtExpiresIn as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
};

export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
