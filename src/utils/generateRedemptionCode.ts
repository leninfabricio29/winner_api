import { customAlphabet } from 'nanoid';

const randomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

export const generateRedemptionCode = (): string => {
  const value = randomCode();
  return `${value.slice(0, 4)}-${value.slice(4)}`;
};
