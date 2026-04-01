import { Document, Model, Schema, Types, model } from 'mongoose';

interface ILocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface IPlace extends Document {
  name: string;
  description: string;
  category_id: Types.ObjectId;
  business_id: Types.ObjectId;
  location: ILocation;
  address: string;
  images: string[];
  phone?: string;
  website?: string;
  schedule?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const placeSchema = new Schema<IPlace>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category_id: { type: Schema.Types.ObjectId, ref: 'PlaceCategory', required: true },
    business_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (value: number[]) => value.length === 2,
          message: 'Coordinates must contain [longitude, latitude].'
        }
      }
    },
    address: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    phone: { type: String, trim: true },
    website: { type: String, trim: true },
    schedule: { type: String, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
  },
  {
    timestamps: true
  }
);

placeSchema.index({ location: '2dsphere' });

export const Place: Model<IPlace> = model<IPlace>('Place', placeSchema);
