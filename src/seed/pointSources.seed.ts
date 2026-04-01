import { connectDB } from '../config/db';
import { PointSource } from '../models/PointSource';

const initialPointSources = [
  { code: 'VISIT', name: 'Visitar un lugar', points: 10, is_active: true },
  { code: 'REVIEW', name: 'Dejar una resena', points: 15, is_active: true },
  { code: 'REFERRAL_SENDER', name: 'Referir a un nuevo usuario', points: 20, is_active: true },
  { code: 'REFERRAL_RECEIVER', name: 'Registrarse con codigo referido', points: 10, is_active: true },
  { code: 'REGISTRATION', name: 'Bono de registro', points: 5, is_active: false }
] as const;

export const seedPointSources = async (): Promise<void> => {
  const count = await PointSource.countDocuments();
  if (count > 0) {
    return;
  }

  await PointSource.insertMany(initialPointSources);
};

const run = async (): Promise<void> => {
  await connectDB();
  await seedPointSources();
  process.exit(0);
};

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
