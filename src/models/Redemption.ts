import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IRedemption extends Document {
  client_id: Types.ObjectId;
  promotion_id: Types.ObjectId;
  business_id: Types.ObjectId;
  points_spent: number;
  redemption_code: string;
  status: 'pending' | 'validated' | 'expired';
  validated_at?: Date;
  expires_at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const redemptionSchema = new Schema<IRedemption>(
  {
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    promotion_id: { type: Schema.Types.ObjectId, ref: 'Promotion', required: true },
    business_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points_spent: { type: Number, required: true, min: 1 },
    redemption_code: { type: String, required: true, unique: true },
    status: { type: String, enum: ['pending', 'validated', 'expired'], default: 'pending' },
    validated_at: { type: Date },
    expires_at: { type: Date, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: true }
  }
);

// TTL index to auto-remove expired pending redemptions after 1 hour grace.
redemptionSchema.index(
  { expires_at: 1 },
  { expireAfterSeconds: 3600, partialFilterExpression: { status: 'pending' } }
);

export const Redemption: Model<IRedemption> = model<IRedemption>('Redemption', redemptionSchema);
