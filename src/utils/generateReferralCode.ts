import { nanoid } from 'nanoid';

export const generateReferralCode = (): string => nanoid(8).toUpperCase();
