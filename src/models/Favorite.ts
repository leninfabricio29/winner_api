import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IFavorite extends Document {
  client_id: Types.ObjectId;
  place_id: Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
  {
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    place_id: { type: Schema.Types.ObjectId, ref: 'Place', required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

favoriteSchema.index({ client_id: 1, place_id: 1 }, { unique: true });

export const Favorite: Model<IFavorite> = model<IFavorite>('Favorite', favoriteSchema);
