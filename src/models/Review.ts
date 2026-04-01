import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IReview extends Document {
  client_id: Types.ObjectId;
  place_id: Types.ObjectId;
  rating: number;
  comment?: string;
  points_awarded: boolean;
  createdAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    place_id: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    points_awarded: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

reviewSchema.index({ client_id: 1, place_id: 1 }, { unique: true });

export const Review: Model<IReview> = model<IReview>('Review', reviewSchema);
