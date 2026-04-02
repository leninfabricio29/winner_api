import admin from 'firebase-admin';
import { isFirebaseReady } from '../config/firebase';
import { Notification } from "../models/Notification";
import { FCMDevice } from '../models/FCMDevice';

export class NotificationService {

  // Crear notificación en BD y enviar push
  async createNotification(
    userId: string,
    title: string,
    description: string,
    type: 'promotion' | 'system' | 'points' | 'social',
    isRead: boolean = false
  ) {
    // Crear notificación en BD
    const notification = new Notification({
      user_id: userId,
      title,
      description,
      type,
      status: isRead ? 'read' : 'pending',
      createdAt: new Date()
    });

    await notification.save();

    // Enviar notificación push
    try {
      await this.sendPushNotification(userId, title, description, type);
    } catch (error) {
      console.error('[NotificationService] Error sending push notification:', error);
      // No fallar si falla el push, la BD ya tiene la notificación
    }

    return notification;
  }

  /**
   * Envía notificación push a través de Firebase Cloud Messaging
   */
  async sendPushNotification(
    userId: string,
    title: string,
    description: string,
    type: string
  ) {
    // Validar que Firebase esté inicializado
    if (!isFirebaseReady()) {
      console.warn('[NotificationService] Firebase not initialized. Push notifications disabled.');
      return;
    }

    // Obtener todos los dispositivos activos del usuario
    const devices = await FCMDevice.find({
      user_id: userId,
      is_active: true
    });

    if (devices.length === 0) {
      console.log(`[NotificationService] No active devices for user ${userId}`);
      return;
    }

    // Preparar mensaje para Firebase
    const message = {
      notification: {
        title,
        body: description
      },
      data: {
        type,
        userId,
        notificationId: 'push-notification'
      }
    };

    // Enviar a cada dispositivo
    const fcmTokens = devices.map(d => d.fcm_token);
    
    for (const token of fcmTokens) {
      try {
        await admin.messaging().send({
          token,
          notification: message.notification,
          data: message.data,
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'default'
            }
          },
          apns: {
            headers: {
              'apns-priority': '10'
            },
            payload: {
              aps: {
                sound: 'default',
                badge: 1
              }
            }
          }
        });

        console.log(`[NotificationService] Push sent to ${token}`);
        
        // Actualizar last_used
        await FCMDevice.findByIdAndUpdate(
          devices.find(d => d.fcm_token === token)?._id,
          { last_used: new Date() }
        );
      } catch (error: any) {
        console.error(`[NotificationService] Failed to send to ${token}:`, error.message);
        
        // Si el token es inválido, marcarlo como inactivo
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          await FCMDevice.updateOne(
            { fcm_token: token },
            { is_active: false }
          );
        }
      }
    }
  }

  // Cambiar estado de la notificación
  async updateNotificationStatus(
    notificationId: string,
    isRead: boolean
  ) {
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new Error("Notificación no encontrada");
    }

    notification.status = isRead ? 'read' : 'pending';
    notification.updatedAt = new Date();

    await notification.save();
    return notification;
  }
}