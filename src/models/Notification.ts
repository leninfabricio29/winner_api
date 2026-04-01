import { Document, Model, Schema, Types, model } from 'mongoose';

export interface INotification  extends Document {
  title: string;
  user_id: Types.ObjectId;
  description?: string;
  status: 'pending' | 'read' ;
  type: 'promotion' | 'system' | 'points' | 'social';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'read'], default: 'pending' },
    type: { type: String, enum: ['promotion', 'system', 'points', 'social'], required: true }
  },
  {
    timestamps: true
  }
);

export const Notification: Model<INotification> = model<INotification>('Notification', notificationSchema);
