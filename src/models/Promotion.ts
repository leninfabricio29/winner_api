import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  description?: string;
  image: string;
  place_id: Types.ObjectId;
  business_id: Types.ObjectId;
  points_required: number;
  start_date: Date;
  end_date: Date;
  max_claims_per_user: number;
  total_max_claims?: number;
  total_claimed: number;
  status: 'active' | 'inactive' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    image: { type: String, required: true, trim: true },
    place_id: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
    business_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points_required: { type: Number, required: true, min: 1 },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    max_claims_per_user: { type: Number, required: true, min: 1 },
    total_max_claims: { type: Number, min: 1 },
    total_claimed: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive', 'expired'], default: 'active' }
  },
  {
    timestamps: true
  }
);

export const Promotion: Model<IPromotion> = model<IPromotion>('Promotion', promotionSchema);
