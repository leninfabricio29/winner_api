import { Document, Model, Schema, model } from 'mongoose';

export interface IPlaceCategory extends Document {
  name: string;
  icon?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

const placeCategorySchema = new Schema<IPlaceCategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    icon: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const PlaceCategory: Model<IPlaceCategory> = model<IPlaceCategory>('PlaceCategory', placeCategorySchema);
