import { Request, Response } from 'express';
import { Place } from '../models/Place';
import { Visit } from '../models/Visit';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { awardOrDeductPoints, getActivePointSource } from '../services/points.service';
import { NotificationService } from '../services/notification.service';


const notificationService = new NotificationService();

const parsePagination = (query: Request['query']): { page: number; limit: number; skip: number } => {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Obtiene las visitas del usuario a un lugar en los últimos 7 días
 */
const getRecentVisits = async (clientId: string, placeId: string) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return Visit.find({
    client_id: clientId,
    place_id: placeId,
    createdAt: { $gte: sevenDaysAgo }
  }).sort({ createdAt: -1 });
};

/**
 * Verifica si hay visita hoy al mismo lugar
 */
const hasVisitToday = (visits: any[], placeId: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return visits.some((visit) => {
    const visitDate = new Date(visit.createdAt);
    visitDate.setHours(0, 0, 0, 0);
    return visitDate.getTime() === today.getTime() && String(visit.place_id) === String(placeId);
  });
};

/**
 * Conta visitas en la semana actual
 */
const countWeeklyVisits = (visits: any[]): number => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return visits.filter((v) => new Date(v.createdAt) >= sevenDaysAgo).length;
};

/**
 * Calcula el porcentaje de puntos según la posición en la semana
 */
const calculatePointsMultiplier = (weeklyVisits: number): number => {
  if (weeklyVisits === 0) return 1.0; // 100% - primera visita
  if (weeklyVisits === 1) return 0.33; // 33% - segunda visita
  return 0; // Bloqueado - tercera o más
};

export const createVisit = asyncHandler(async (req: Request, res: Response) => {
  const place = await Place.findOne({ _id: req.body.place_id, status: 'active' });
  if (!place) {
    throw new ApiError(404, 'Lugar no encontrado');
  }

  // Obtener visitas recientes a este lugar
  const recentVisits = await getRecentVisits(req.user!.userId, req.body.place_id);

  // Validación 1: Verificar si ya visitó hoy
  if (hasVisitToday(recentVisits, req.body.place_id)) {
    throw new ApiError(
      429,
      'Ya visitaste este lugar hoy. Vuelve mañana para obtener más puntos.'
    );
  }

  // Validación 2: Contar visitas esta semana
  const weeklyVisits = countWeeklyVisits(recentVisits);

  if (weeklyVisits >= 2) {
    throw new ApiError(
      429,
      'Ya has visitado este lugar 2 veces esta semana. Máximo 2 visitas por semana.'
    );
  }

  // Crear la visita
  const visit = await Visit.create({
    client_id: req.user?.userId,
    place_id: req.body.place_id,
    points_awarded: false
  });

  // Obtener puntos base
  const visitPoints = await getActivePointSource('VISIT');
  if (visitPoints) {
    // Calcular multiplicador según visita en la semana
    const multiplier = calculatePointsMultiplier(weeklyVisits);
    const awardedPoints = Math.ceil(visitPoints * multiplier);

    // Otorgar puntos (0 si es tercera visita)
    if (multiplier > 0) {
      await awardOrDeductPoints({
        clientId: req.user!.userId,
        sourceCode: 'VISIT',
        points: awardedPoints,
        description: `Puntos por visita a ${place.name} (${Math.round(multiplier * 100)}%)`,
        referenceId: String(visit._id)
      });

      visit.points_awarded = true;
      await visit.save();

      const visitCount = weeklyVisits + 1;
      const message = visitCount === 1
        ? `Has recibido ${awardedPoints} puntos por tu visita a ${place.name}`
        : `Has recibido ${awardedPoints} puntos (33% de bonificación) por tu segunda visita esta semana a ${place.name}`;

      await notificationService.createNotification(
        String(req.user!.userId),
        'Puntos otorgados por visita',
        message,
        'points'
      );
    }
  }

  res.status(201).json({
    success: true,
    data: visit,
    message: 'Visita registrada correctamente'
  });
});

export const listMyVisits = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    Visit.find({ client_id: req.user?.userId })
      .populate('place_id', 'name address  images ')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Visit.countDocuments({ client_id: req.user?.userId })
  ]);

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    }
  });
});
