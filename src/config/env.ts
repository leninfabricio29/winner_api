import dotenv from 'dotenv';

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  port: toNumber(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/puntos_lugares',
  jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resetPasswordExpiresIn: process.env.RESET_PASSWORD_EXPIRES_IN || '1h',
  redemptionCodeExpiresHours: toNumber(process.env.REDEMPTION_CODE_EXPIRES_HOURS, 24)
};
