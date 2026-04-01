import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { env } from '../config/env';
import { Promotion } from '../models/Promotion';
import { Redemption, IRedemption } from '../models/Redemption';
import { awardOrDeductPoints } from './points.service';
import { ApiError } from '../utils/ApiError';
import { generateRedemptionCode } from '../utils/generateRedemptionCode';

interface CreateRedemptionResult {
  redemption: IRedemption;
  promotionTitle: string;
  pointsRequired: number;
}

const isTransactionsNotSupportedError = (error: unknown): boolean => {
  if (error instanceof MongoServerError && error.code === 20) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('transaction numbers are only allowed on a replica set member or mongos');
  }

  return false;
};

const isPromotionAvailable = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return now >= startDate && now <= endDate;
};

const safeAwardOrDeductPoints = async (
  input: Parameters<typeof awardOrDeductPoints>[0]
): Promise<void> => {
  try {
    await awardOrDeductPoints(input);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return;
    }

    throw error;
  }
};

export const createPromotionRedemption = async (
  clientId: string,
  promotionId: string
): Promise<CreateRedemptionResult> => {
  const session = await mongoose.startSession();
  let createdRedemption: IRedemption | null = null;
  let promotionTitle = '';
  let pointsRequired = 0;

  const executeRedemption = async (sessionArg?: mongoose.ClientSession): Promise<void> => {
    const promotion = await Promotion.findById(promotionId).session(sessionArg || null);

    if (!promotion) {
      throw new ApiError(404, 'Promocion no encontrada');
    }

    console.log('Promotion found:', promotion);

    if (promotion.status !== 'active' || !isPromotionAvailable(promotion.start_date, promotion.end_date)) {
      throw new ApiError(400, 'La promocion no esta disponible');
    }

    if (
      typeof promotion.total_max_claims === 'number' &&
      promotion.total_claimed >= promotion.total_max_claims
    ) {
      throw new ApiError(400, 'La promocion alcanzo su limite global');
    }

    const countQuery = Redemption.countDocuments({
      client_id: clientId,
      promotion_id: promotion._id
    });

    const userClaims = sessionArg ? await countQuery.session(sessionArg) : await countQuery;

    if (userClaims >= promotion.max_claims_per_user) {
      throw new ApiError(400, 'Superaste el maximo de canjes permitidos para esta promocion');
    }

    await safeAwardOrDeductPoints({
      clientId,
      sourceCode: 'REDEMPTION',
      points: -promotion.points_required,
      description: `Canje de promocion: ${promotion.title}`,
      referenceId: String(promotion._id),
      session: sessionArg
    });

    let code = generateRedemptionCode();

    while (true) {
      const existsQuery = Redemption.exists({ redemption_code: code });
      const exists = sessionArg ? await existsQuery.session(sessionArg) : await existsQuery;

      if (!exists) {
        break;
      }

      code = generateRedemptionCode();
    }

    const expiresAt = new Date(Date.now() + env.redemptionCodeExpiresHours * 60 * 60 * 1000);

    const created = await Redemption.create(
      [
        {
          client_id: clientId,
          promotion_id: promotion._id,
          business_id: promotion.business_id,
          points_spent: promotion.points_required,
          redemption_code: code,
          status: 'pending',
          expires_at: expiresAt
        }
      ],
      sessionArg ? { session: sessionArg } : undefined
    );

    promotion.total_claimed += 1;
    await promotion.save(sessionArg ? { session: sessionArg } : undefined);

    createdRedemption = created[0];
    promotionTitle = promotion.title;
    pointsRequired = promotion.points_required;
  };

  try {
    await session.withTransaction(async () => {
      await executeRedemption(session);
    });
  } catch (error) {
    if (isTransactionsNotSupportedError(error)) {
      await executeRedemption();
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  if (!createdRedemption) {
    throw new ApiError(500, 'No fue posible generar el canje');
  }

  return {
    redemption: createdRedemption,
    promotionTitle,
    pointsRequired
  };
};

export const validateBusinessRedemption = async (
  businessId: string,
  redemptionCode: string
): Promise<IRedemption> => {
  const redemption = await Redemption.findOne({
    redemption_code: redemptionCode,
    business_id: businessId
  }).populate('promotion_id');

  if (!redemption) {
    throw new ApiError(404, 'Codigo de canje no encontrado');
  }

  if (redemption.status !== 'pending') {
    throw new ApiError(400, 'El codigo no esta pendiente de validacion');
  }

  if (redemption.expires_at < new Date()) {
    redemption.status = 'expired';
    await redemption.save();
    throw new ApiError(400, 'El codigo de canje ya expiro');
  }

  redemption.status = 'validated';
  redemption.validated_at = new Date();
  await redemption.save();

  return redemption;
};

export const expirePendingRedemptionsAndRefund = async (): Promise<number> => {
  const expired = await Redemption.find({
    status: 'pending',
    expires_at: { $lt: new Date() }
  });

  for (const redemption of expired) {
    const session = await mongoose.startSession();

    const executeExpiry = async (sessionArg?: mongoose.ClientSession): Promise<void> => {
      const fresh = sessionArg
        ? await Redemption.findById(redemption._id).session(sessionArg)
        : await Redemption.findById(redemption._id);

      if (!fresh || fresh.status !== 'pending') {
        return;
      }

      fresh.status = 'expired';
      await fresh.save(sessionArg ? { session: sessionArg } : undefined);

      await safeAwardOrDeductPoints({
        clientId: String(fresh.client_id),
        sourceCode: 'REDEMPTION_REFUND',
        points: fresh.points_spent,
        description: `Reversion por expiracion de canje ${fresh.redemption_code}`,
        referenceId: String(fresh._id),
        session: sessionArg
      });

      await Promotion.updateOne(
        { _id: fresh.promotion_id, total_claimed: { $gt: 0 } },
        { $inc: { total_claimed: -1 } },
        sessionArg ? { session: sessionArg } : undefined
      );
    };

    try {
      await session.withTransaction(async () => {
        await executeExpiry(session);
      });
    } catch (error) {
      if (isTransactionsNotSupportedError(error)) {
        await executeExpiry();
      }
    }

    await session.endSession();
  }

  return expired.length;
};
