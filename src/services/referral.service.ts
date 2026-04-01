import { ClientSession } from 'mongoose';
import { IUser, User } from '../models/User';
import { PointSourceCode } from '../models/PointSource';
import { awardOrDeductPoints, getActivePointSource } from './points.service';

export const processReferralRewards = async (
  newClient: IUser,
  referralCodeUsed?: string,
  session?: ClientSession
): Promise<void> => {
  if (!referralCodeUsed) {
    return;
  }

  const referrer = await User.findOne({
    referral_code: referralCodeUsed,
    role: 'client',
    status: 'active'
  }).session(session || null);

  if (!referrer) {
    return;
  }

  const senderPoints = await getActivePointSource('REFERRAL_SENDER');
  const receiverPoints = await getActivePointSource('REFERRAL_RECEIVER');

  if (senderPoints) {
    await awardOrDeductPoints({
      clientId: String(referrer._id),
      sourceCode: 'REFERRAL_SENDER',
      points: senderPoints,
      description: 'Puntos por referir un nuevo usuario',
      referenceId: String(newClient._id),
      session
    });
  }

  if (receiverPoints) {
    await awardOrDeductPoints({
      clientId: String(newClient._id),
      sourceCode: 'REFERRAL_RECEIVER',
      points: receiverPoints,
      description: 'Puntos por registrarse con codigo de referido',
      referenceId: String(referrer._id),
      session
    });
  }
};

export const applyRegistrationBonus = async (
  clientId: string,
  session?: ClientSession
): Promise<void> => {
  const registrationPoints = await getActivePointSource('REGISTRATION');

  if (!registrationPoints) {
    return;
  }

  await awardOrDeductPoints({
    clientId,
    sourceCode: 'REGISTRATION' as PointSourceCode,
    points: registrationPoints,
    description: 'Bono por registro',
    session
  });
};
