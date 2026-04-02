import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IFCMDevice extends Document {
  user_id: Types.ObjectId;
  fcm_token: string;
  device_name?: string;
  is_active: boolean;
  last_used: Date;
  createdAt: Date;
  updatedAt: Date;
}

const fcmDeviceSchema = new Schema<IFCMDevice>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fcm_token: { type: String, required: true, unique: true, trim: true },
    device_name: { type: String, trim: true },
    is_active: { type: Boolean, default: true },
    last_used: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Índice para evitar duplicados por usuario + token
fcmDeviceSchema.index({ user_id: 1, fcm_token: 1 }, { unique: true, sparse: true });

export const FCMDevice: Model<IFCMDevice> = model<IFCMDevice>('FCMDevice', fcmDeviceSchema);
