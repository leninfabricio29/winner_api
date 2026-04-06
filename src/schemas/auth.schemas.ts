import { z } from 'zod';

export const registerClientSchema = z.object({
  body: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().min(7),
    ci: z.string().regex(/^\d{10}$/, 'La cedula debe tener 10 digitos'),
    referral_code_used: z.string().min(4).optional()
  })
});

export const registerBusinessSchema = z.object({
  body: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().min(7),
    ruc: z.string().regex(/^\d{13}$/, 'El RUC debe tener 13 digitos'),
    business_name: z.string().min(2),
    business_category: z.string().min(2)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});

export const forgotPasswordSchema = z.object({
  body: z
    .object({
      ci: z.string().regex(/^\d{13}$/, 'La cedula debe tener 13 digitos').optional(),
      ruc: z.string().regex(/^\d{13}$/, 'El RUC debe tener 13 digitos').optional()
    })
    .refine((value) => Boolean(value.ci || value.ruc), {
      message: 'Debes enviar ci o ruc'
    })
});

export const validateResetTokenSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/, 'El codigo debe tener 6 digitos')
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    token: z.string().regex(/^\d{6}$/, 'El token debe tener 6 digitos'),
    new_password: z.string().min(6)
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: z.string().min(6),
    new_password: z.string().min(6)
  })
});
