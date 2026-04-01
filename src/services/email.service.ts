import nodemailer, { Transporter } from 'nodemailer';
import * as templates from '../utils/email.templates';
import type {
  VerificationCodeData,
  AccountCreatedData,
  PasswordChangedData,
  TemplateData,
} from '../utils//email.templates';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EmailResult {
  success: boolean;
  message: string;
  email: string;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  total: number;
  successful: number;
  failed: number;
  details: EmailResult[];
}

export interface BulkRecipient<T extends TemplateData> {
  to: string;
  data: T;
}

type TemplateName = keyof typeof templates;

// ─── Servicio ─────────────────────────────────────────────────────────────────

/**
 * Servicio centralizado de email.
 *
 * @example
 * // Envío genérico
 * await emailService.send(to, subject, html);
 *
 * // Envío con template por nombre
 * await emailService.sendTemplate(to, 'verificationCode', { name, code, expiresIn });
 *
 * // Métodos de conveniencia
 * await emailService.sendVerificationCode(to, { name, code, expiresIn });
 * await emailService.sendAccountCreated(to, { name, email, loginUrl });
 * await emailService.sendPasswordChanged(to, { name, ip, device, resetUrl });
 * await emailService.sendPaymentPending(to, { adminName, entityName });
 *
 * // Envío masivo
 * await emailService.sendBulk('passwordChanged', [{ to, data }]);
 */
class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  // ─── Inicialización ──────────────────────────────────────────────────────

  private initTransporter(): void {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST ?? 'smtp.zoho.com',
        port: parseInt(process.env.EMAIL_PORT ?? '465'),
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      this.transporter.verify((error) => {
        if (error) {
          console.log('❌ Error al verificar el servicio de email:', error);
        } else {
          console.log('✅ Servicio de email configurado correctamente');
        }
      });
    } catch (error) {
      console.log('❌ Error al inicializar el transportador de email:', error);
    }
  }

  // ─── Asuntos por defecto ─────────────────────────────────────────────────

  private readonly defaultSubjects: Record<TemplateName, string> = {
    verificationCode: '🔐 Tu código de verificación — SoftKilla',
    accountCreated:   '✅ ¡Tu cuenta fue creada exitosamente! — SoftKilla',
    passwordChanged:  '🔑 Tu contraseña ha sido actualizada — SoftKilla',
  };

  // ─── Núcleo ──────────────────────────────────────────────────────────────

  /**
   * Envía un correo con contenido HTML arbitrario.
   * Función base que usan todos los demás métodos.
   */
  async send(to: string, subject: string, htmlContent: string): Promise<EmailResult> {
    if (!this.transporter) {
      return { success: false, message: 'Transporter no inicializado', email: to };
    }

    try {
      const result = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`📧 Correo enviado a ${to}`, { messageId: result.messageId });

      return {
        success: true,
        message: 'Correo enviado exitosamente',
        email: to,
        messageId: result.messageId,
      };
    } catch (error) {
      const err = error as Error;
      console.log(`❌ Error al enviar correo a ${to}:`, err);

      return {
        success: false,
        message: 'Error al enviar correo',
        email: to,
        error: err.message,
      };
    }
  }

  /**
   * Envía un correo usando un template registrado.
   * El asunto puede sobreescribirse con el parámetro `subject`.
   */
  async sendTemplate<T extends TemplateData>(
    to: string,
    templateName: TemplateName,
    data: T,
    subject?: string,
  ): Promise<EmailResult> {
    const templateFn = templates[templateName] as ((data: T) => string) | undefined;

    if (typeof templateFn !== 'function') {
      console.log(`❌ Template "${templateName}" no encontrado`);
      return { success: false, message: `Template "${templateName}" no existe`, email: to };
    }

    const html = templateFn(data);
    const resolvedSubject = subject ?? this.defaultSubjects[templateName];

    return this.send(to, resolvedSubject, html);
  }

  // ─── Métodos de conveniencia ─────────────────────────────────────────────

  /** Envía el código de verificación para proceder a crear la cuenta. */
  sendVerificationCode(to: string, data: VerificationCodeData): Promise<EmailResult> {
    return this.sendTemplate(to, 'verificationCode', data);
  }

  /** Confirma al usuario que su cuenta fue creada exitosamente. */
  sendAccountCreated(to: string, data: AccountCreatedData): Promise<EmailResult> {
    return this.sendTemplate(to, 'accountCreated', data);
  }

  /** Notifica al usuario que su contraseña fue actualizada. */
  sendPasswordChanged(to: string, data: PasswordChangedData): Promise<EmailResult> {
    return this.sendTemplate(to, 'passwordChanged', data);
  }


  async sendBulk<T extends TemplateData>(
    templateName: TemplateName,
    recipients: BulkRecipient<T>[],
  ): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      total: recipients.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    for (const { to, data } of recipients) {
      const emailResult = await this.sendTemplate(to, templateName, data);
      emailResult.success ? result.successful++ : result.failed++;
      result.details.push(emailResult);
    }

    console.log(`📬 Envío masivo "${templateName}": ${result.successful}/${result.total} exitosos`);
    return result;
  }
}

export default new EmailService();