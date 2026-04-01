import { Document, Model, Schema, model } from 'mongoose';

export type PointSourceCode =
  | 'VISIT'
  | 'REVIEW'
  | 'REFERRAL_SENDER'
  | 'REFERRAL_RECEIVER'
  | 'REGISTRATION';

export interface IPointSource extends Document {
  name: string;
  code: PointSourceCode;
  points: number;
  is_active: boolean;
  description?: string;
  updatedAt: Date;
}

const pointSourceSchema = new Schema<IPointSource>(
  {
    name: { type: String, required: true, trim: true },
    code: {
      type: String,
      enum: ['VISIT', 'REVIEW', 'REFERRAL_SENDER', 'REFERRAL_RECEIVER', 'REGISTRATION'],
      required: true,
      unique: true
    },
    points: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
    description: { type: String, trim: true }
  },
  {
    timestamps: { createdAt: false, updatedAt: true }
  }
);

export const PointSource: Model<IPointSource> = model<IPointSource>('PointSource', pointSourceSchema);
