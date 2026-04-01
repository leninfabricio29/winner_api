// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface VerificationCodeData {
  name: string;
  code: string;
  expiresIn?: number;
}

export interface AccountCreatedData {
  name: string;
  email: string;
  loginUrl?: string;
}

export interface PasswordChangedData {
  name: string;
  ip?: string;
  device?: string;
  resetUrl?: string;
}

export interface PaymentPendingData {
  adminName: string;
  entityName?: string;
}

export type TemplateData =
  | VerificationCodeData
  | AccountCreatedData
  | PasswordChangedData
  | PaymentPendingData;

// ─── Estilos base compartidos ─────────────────────────────────────────────────

const baseStyles = `
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
  }
  .email-container {
    max-width: 600px;
    margin: 20px auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  .content { padding: 30px; }
  .greeting { font-size: 18px; margin-bottom: 20px; color: #333; }
  .info-box { padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid; }
  .info-box p { margin: 8px 0; font-weight: 500; }
  .details { background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0; }
  .details p { margin: 10px 0; color: #555; }
  .code-block {
    background-color: #1e1e2e;
    color: #cdd6f4;
    font-family: 'Courier New', Courier, monospace;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 10px;
    text-align: center;
    padding: 20px;
    border-radius: 6px;
    margin: 24px 0;
  }
  .footer {
    background-color: #f8f9fa;
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #666;
    border-top: 1px solid #e0e0e0;
  }
  .footer p { margin: 5px 0; }
`;

// ─── Layout base ──────────────────────────────────────────────────────────────

interface WrapTemplateOptions {
  headerColor: [string, string];
  headerEmoji: string;
  headerTitle: string;
  body: string;
}

const wrapTemplate = ({ headerColor, headerEmoji, headerTitle, body }: WrapTemplateOptions): string => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${baseStyles}
    .header {
      background: linear-gradient(135deg, ${headerColor[0]} 0%, ${headerColor[1]} 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${headerEmoji} ${headerTitle}</h1>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>Este es un mensaje automático, por favor no responda directamente a este correo.</p>
      <p>Si necesita ayuda, contacte a nuestro equipo de soporte.</p>
      <p>&copy; ${new Date().getFullYear()} SoftKilla — Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
`;

const signature = `
  <p style="margin-top: 30px; color: #666;">
    Atentamente,<br>
    <strong>Equipo SoftKilla</strong>
  </p>
`;

// ─── Templates ────────────────────────────────────────────────────────────────

/**
 * Código de verificación para proceder a crear la cuenta.
 */
export const verificationCode = ({ name, code, expiresIn = 15 }: VerificationCodeData): string => {
  const body = `
    <p class="greeting">Hola, <strong>${name}</strong> 👋</p>

    <p>Para continuar con la creación de tu cuenta en <strong>SoftKilla</strong>, ingresa el siguiente código de verificación:</p>

    <div class="code-block">${code}</div>

    <div class="details">
      <p>⏱️ <strong>Válido por:</strong> ${expiresIn} minutos</p>
      <p>🔐 <strong>Uso único:</strong> Este código expira en cuanto sea utilizado</p>
    </div>

    <div class="info-box" style="background-color: #fff3cd; border-color: #ffc107;">
      <p style="color: #856404;">⚠️ Si no solicitaste crear una cuenta, ignora este mensaje. Nadie podrá acceder a tu información sin este código.</p>
    </div>

    ${signature}
  `;

  return wrapTemplate({
    headerColor: ['#1565c0', '#0d47a1'],
    headerEmoji: '🔐',
    headerTitle: 'VERIFICACIÓN DE CUENTA',
    body,
  });
};

/**
 * Confirmación de que la cuenta fue creada exitosamente.
 */
export const accountCreated = ({ name, email, loginUrl = '#' }: AccountCreatedData): string => {
  const body = `
    <p class="greeting">¡Bienvenido/a, <strong>${name}</strong>! 🎉</p>

    <p>Tu cuenta en <strong>SoftKilla</strong> ha sido creada exitosamente. Ya puedes comenzar a usar todos nuestros servicios.</p>

    <div class="info-box" style="background-color: #d4edda; border-color: #28a745;">
      <p style="color: #155724;">✅ Tu cuenta está activa y lista para usar.</p>
    </div>

    <div class="details">
      <p>📧 <strong>Correo registrado:</strong> ${email}</p>
      <p>📅 <strong>Fecha de creación:</strong> ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
    </div>

    <p>Puedes iniciar sesión en cualquier momento desde el siguiente enlace:</p>

    <div style="text-align: center;">
      <a href="${loginUrl}"
        style="display:inline-block; background-color:#1565c0; color:white; padding:12px 32px;
               text-decoration:none; border-radius:4px; font-weight:600; margin: 16px 0;">
        Iniciar sesión →
      </a>
    </div>

    <p>Si tienes alguna pregunta, nuestro equipo de soporte está disponible para ayudarte.</p>

    ${signature}
  `;

  return wrapTemplate({
    headerColor: ['#2e7d32', '#1b5e20'],
    headerEmoji: '✅',
    headerTitle: 'CUENTA CREADA EXITOSAMENTE',
    body,
  });
};

/**
 * Notificación de que la contraseña fue actualizada.
 * Incluye botón de emergencia para restablecerla si no fue el usuario.
 */
export const passwordChanged = ({ name, ip = 'No disponible', device = 'No disponible', resetUrl = '#' }: PasswordChangedData): string => {
  const body = `
    <p class="greeting">Hola, <strong>${name}</strong>,</p>

    <p>Te informamos que la contraseña de tu cuenta en <strong>SoftKilla</strong> fue modificada recientemente.</p>

    <div class="details">
      <p>🕐 <strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>
      <p>🌐 <strong>Dirección IP:</strong> ${ip}</p>
      <p>💻 <strong>Dispositivo:</strong> ${device}</p>
    </div>

    <div class="info-box" style="background-color: #fff3cd; border-color: #ffc107;">
      <p style="color: #856404;">🔔 Si fuiste tú quien realizó este cambio, no necesitas hacer nada más.</p>
    </div>

    <div class="info-box" style="background-color: #f8d7da; border-color: #dc3545;">
      <p style="color: #721c24;">🚨 <strong>¿No realizaste este cambio?</strong> Actúa de inmediato: restablece tu contraseña y revisa la actividad de tu cuenta.</p>
    </div>

    <div style="text-align: center;">
      <a href="${resetUrl}"
        style="display:inline-block; background-color:#d32f2f; color:white; padding:12px 32px;
               text-decoration:none; border-radius:4px; font-weight:600; margin: 16px 0;">
        Restablecer contraseña →
      </a>
    </div>

    ${signature}
  `;

  return wrapTemplate({
    headerColor: ['#e65100', '#bf360c'],
    headerEmoji: '🔑',
    headerTitle: 'CONTRASEÑA ACTUALIZADA',
    body,
  });
};
