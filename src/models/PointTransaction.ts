import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPointTransaction extends Document {
  client_id: Types.ObjectId;
  source_code: string;
  points: number;
  reference_id?: Types.ObjectId;
  description: string;
  createdAt: Date;
}

const pointTransactionSchema = new Schema<IPointTransaction>(
  {
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source_code: { type: String, required: true, trim: true },
    points: { type: Number, required: true },
    reference_id: { type: Schema.Types.ObjectId },
    description: { type: String, required: true, trim: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const PointTransaction: Model<IPointTransaction> = model<IPointTransaction>(
  'PointTransaction',
  pointTransactionSchema
);
