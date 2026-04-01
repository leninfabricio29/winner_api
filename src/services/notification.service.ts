import { Notification } from "../models/Notification";

export class NotificationService {

  // Crear notificación
  async createNotification(
    userId: string,
    title: string,
    description: string,
    type: 'promotion' | 'system' | 'points' | 'social',
    isRead: boolean = false
  ) {
    const notification = new Notification({
      user_id: userId,
      title,
      description,
      type,
      status: isRead ? 'read' : 'pending',
      createdAt: new Date()
    });

    await notification.save();
    return notification;
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