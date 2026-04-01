import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { MongoServerError } from 'mongodb';
import { Request, Response } from 'express';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { signJwt } from '../utils/jwt';
import { generateReferralCode } from '../utils/generateReferralCode';
import { applyRegistrationBonus, processReferralRewards } from '../services/referral.service';
import emailService from '../services/email.service';
import { NotificationService } from '../services/notification.service';
import { getActivePointSource } from '../services/points.service';

const safeUserProjection = {
  _id: 1,
  email: 1,
  role: 1,
  first_name: 1,
  last_name: 1,
  points_balance: 1
};

const notificationService = new NotificationService();

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

const generateSixDigitCode = (): string => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

const getRequestIp = (req: Request): string | undefined => {
  const forwarded = req.headers['x-forwarded-for'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }

  return req.ip;
};

export const registerClient = asyncHandler(async (req: Request, res: Response) => {
  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    ci,
    referral_code_used,
    avatar_url
  } = req.body as {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    ci: string;
    referral_code_used?: string;
    avatar_url?: string;
  };

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { ci }]
  });

  if (existing) {
    throw new ApiError(409, 'El email o la cedula ya estan registrados');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const createClientWithRewards = async (session?: mongoose.ClientSession): Promise<string> => {
    let referralCode = generateReferralCode();

    while (true) {
      const existsQuery = User.exists({ referral_code: referralCode });
      const exists = session ? await existsQuery.session(session) : await existsQuery;

      if (!exists) {
        break;
      }

      referralCode = generateReferralCode();
    }

    const created = new User({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password: passwordHash,
      phone,
      ci,
      role: 'client',
      referral_code: referralCode,
      referral_used: referral_code_used,
      points_balance: 0,
      avatar_url: avatar_url || ''
    });

    await created.save(session ? { session } : undefined);
    await applyRegistrationBonus(String(created._id), session);
    await processReferralRewards(created, referral_code_used, session);

    return String(created._id);
  };

  const session = await mongoose.startSession();
  let userId = '';

  try {
    await session.withTransaction(async () => {
      userId = await createClientWithRewards(session);
    });
  } catch (error) {
    if (isTransactionsNotSupportedError(error)) {
      userId = await createClientWithRewards();
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  const user = await User.findById(userId, safeUserProjection);
  if (!user) {
    throw new ApiError(500, 'Error al recuperar usuario creado');
  }

  const notifyReferralUsers = async (): Promise<void> => {
    if (!referral_code_used) {
      return;
    }

    const referrer = await User.findOne({
      referral_code: referral_code_used,
      role: 'client',
      status: 'active'
    }).select('_id first_name last_name');

    if (!referrer) {
      return;
    }

    const senderPoints = await getActivePointSource('REFERRAL_SENDER');
    const receiverPoints = await getActivePointSource('REFERRAL_RECEIVER');

    const notifications: Promise<unknown>[] = [];

    if (senderPoints) {
      notifications.push(
        notificationService.createNotification(
          String(referrer._id),
          'Recibiste puntos por referido',
          `${user.first_name} ${user.last_name} uso tu codigo de referido. Se te acreditaron ${senderPoints} puntos.`,
          'points'
        )
      );
    }

    if (receiverPoints) {
      notifications.push(
        notificationService.createNotification(
          String(user._id),
          'Recibiste puntos de bienvenida por referido',
          `Te registraste con el codigo de ${referrer.first_name} ${referrer.last_name}. Se te acreditaron ${receiverPoints} puntos.`,
          'points'
        )
      );
    }

    if (notifications.length > 0) {
      await Promise.all(notifications);
    }
  };

  const token = signJwt({
    userId: String(user._id),
    email: user.email,
    role: user.role
  });

  await emailService.sendAccountCreated(user.email, {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email
  });

  try {
    await notifyReferralUsers();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al crear notificaciones de referido', error);
  }

  res.status(201).json({
    success: true,
    data: { token, user },
    message: 'Cliente registrado correctamente'
  });
});

export const registerBusiness = asyncHandler(async (req: Request, res: Response) => {
  const {
    first_name,
    last_name,
    email,
    password,
    phone,
    ruc,
    business_name,
    business_category
  } = req.body as {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone: string;
    ruc: string;
    business_name: string;
    business_category: string;
  };

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { ruc }]
  });

  if (existing) {
    throw new ApiError(409, 'El email o el RUC ya estan registrados');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    first_name,
    last_name,
    email: email.toLowerCase(),
    password: passwordHash,
    phone,
    role: 'business',
    ruc,
    business_name,
    business_category
  });

  const token = signJwt({
    userId: String(user._id),
    email: user.email,
    role: user.role
  });

  await emailService.sendAccountCreated(user.email, {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email
  });

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        ruc: user.ruc,
        business_name: user.business_name,
        business_category: user.business_category
      }
    },
    message: 'Negocio registrado correctamente'
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  const user = await User.findOne({ email: email.toLowerCase(), status: { $ne: 'deleted' } });
  if (!user) {
    throw new ApiError(401, 'Credenciales invalidas');
  }

  if (user.status === 'suspended') {
    throw new ApiError(403, 'Usuario suspendido');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, 'Credenciales invalidas');
  }

  const token = signJwt({
    userId: String(user._id),
    email: user.email,
    role: user.role
  });

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        _id: user._id,
        referral_code: user.referral_code,
        avatar_url: user.avatar_url,
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        ci: user.ci,
        ruc: user.ruc,
        business_name: user.business_name,
        business_category: user.business_category
      }
    }
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { ci, ruc } = req.body as { ci?: string; ruc?: string };

  const filters: Record<string, unknown>[] = [];
  if (ci) {
    filters.push({ ci });
  }
  if (ruc) {
    filters.push({ ruc });
  }

  const user = await User.findOne({
    status: { $ne: 'deleted' },
    ...(filters.length > 0 ? { $or: filters } : {})
  });

  if (!user || !user.email) {
    res.status(200).json({
      success: true,
      message: 'Si el usuario existe, se envio el codigo de recuperacion'
    });
    return;
  }

  const token = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  user.reset_password_token = token;
  user.reset_password_expires_at = expiresAt;
  await user.save();

  const emailResult = await emailService.sendVerificationCode(user.email, {
    name: `${user.first_name} ${user.last_name}`,
    code: token,
    expiresIn: 60
  });

  if (!emailResult.success) {
    throw new ApiError(500, 'No se pudo enviar el correo de recuperacion');
  }

  res.status(200).json({
    success: true,
    message: 'Codigo de recuperacion enviado',
    email: user.email
  });
});

export const validateResetPasswordToken = asyncHandler(async (req: Request, res: Response) => {
  const { email, code } = req.body as { email: string; code: string };

  const user = await User.findOne({
    email: email.toLowerCase(),
    status: { $ne: 'deleted' }
  });

  const isValid = Boolean(
    user &&
    user.reset_password_token === code &&
    user.reset_password_expires_at &&
    user.reset_password_expires_at > new Date()
  );

  res.status(200).json({
    success: true,
    data: isValid
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, token, new_password } = req.body as {
    email: string;
    token: string;
    new_password: string;
  };

  const user = await User.findOne({
    email: email.toLowerCase(),
    reset_password_token: token,
    reset_password_expires_at: { $gt: new Date() }
  });

  if (!user) {
    throw new ApiError(400, 'Token invalido o expirado');
  }

  user.password = await bcrypt.hash(new_password, 10);
  user.reset_password_token = undefined;
  user.reset_password_expires_at = undefined;
  await user.save();

  await emailService.sendPasswordChanged(user.email, {
    name: `${user.first_name} ${user.last_name}`,
    ip: getRequestIp(req),
    device: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Contrasena actualizada correctamente'
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { current_password, new_password } = req.body as {
    current_password: string;
    new_password: string;
  };

  const userId = req.user?.userId;
  if (!userId) {
    throw new ApiError(401, 'No autenticado');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  const isMatch = await bcrypt.compare(current_password, user.password);
  if (!isMatch) {
    throw new ApiError(400, 'Contrasena actual incorrecta');
  }

  user.password = await bcrypt.hash(new_password, 10);
  await user.save();

  await emailService.sendPasswordChanged(user.email, {
    name: `${user.first_name} ${user.last_name}`,
    ip: getRequestIp(req),
    device: req.headers['user-agent']
  });

  res.status(200).json({
    success: true,
    message: 'Contrasena cambiada correctamente'
  });
});
