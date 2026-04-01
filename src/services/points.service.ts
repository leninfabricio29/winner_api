import { ClientSession, Types } from 'mongoose';
import { PointSource, PointSourceCode } from '../models/PointSource';
import { PointTransaction } from '../models/PointTransaction';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

interface AwardPointsInput {
  clientId: string;
  sourceCode: PointSourceCode | string;
  points: number;
  description: string;
  referenceId?: string | Types.ObjectId;
  session?: ClientSession;
}

export const getActivePointSource = async (code: PointSourceCode): Promise<number | null> => {
  const source = await PointSource.findOne({ code, is_active: true }).lean();
  if (!source) {
    return null;
  }

  return source.points;
};

export const awardOrDeductPoints = async ({
  clientId,
  sourceCode,
  points,
  description,
  referenceId,
  session
}: AwardPointsInput): Promise<void> => {
  const client = await User.findOne({ _id: clientId, role: 'client' }).session(session || null);

  if (!client) {
    throw new ApiError(404, 'Cliente no encontrado');
  }

  const nextBalance = (client.points_balance || 0) + points;

  if (nextBalance < 0) {
    throw new ApiError(400, 'Saldo de puntos insuficiente');
  }

  await PointTransaction.create(
    [
      {
        client_id: client._id,
        source_code: sourceCode,
        points,
        reference_id: referenceId,
        description
      }
    ],
    session ? { session } : undefined
  );

  client.points_balance = nextBalance;
  await client.save({ session: session || undefined });
};
