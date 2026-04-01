import cors from 'cors';
import cron from 'node-cron';
import express, { Request, Response } from 'express';
import { connectDB } from './config/db';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { PointSource } from './models/PointSource';
import apiRoutes from './routes';
import { expirePendingRedemptionsAndRefund } from './services/redemption.service';
import admin from './config/firebase';  

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { status: 'ok' } });
});

app.use('/api/v1', apiRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.originalUrl}` });
});

app.use(errorHandler);


const initialPointSources = [
  { code: 'VISIT', name: 'Visitar un lugar', points: 10, is_active: true },
  { code: 'REVIEW', name: 'Dejar una resena', points: 15, is_active: true },
  { code: 'REFERRAL_SENDER', name: 'Referir a un nuevo usuario', points: 20, is_active: true },
  { code: 'REFERRAL_RECEIVER', name: 'Registrarse con codigo referido', points: 10, is_active: true },
  { code: 'REGISTRATION', name: 'Bono de registro', points: 5, is_active: false }
] as const;

const ensurePointSourcesSeeded = async (): Promise<void> => {
  const count = await PointSource.countDocuments();
  if (count === 0) {
    await PointSource.insertMany(initialPointSources);
  }
};

const bootstrap = async (): Promise<void> => {
  await connectDB();
  await ensurePointSourcesSeeded();

  cron.schedule('0 * * * *', async () => {
    try {
      await expirePendingRedemptionsAndRefund();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error en job de expiracion de canjes', error);
    }
  });

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API ejecutandose en http://localhost:${env.port}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Error al iniciar aplicacion', error);
  process.exit(1);
});
