import { Document, Model, Schema, model } from 'mongoose';

export interface IAdvertisement extends Document {
  image: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const advertisementSchema = new Schema<IAdvertisement>(
  {
    image: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Advertisement: Model<IAdvertisement> = model<IAdvertisement>('Advertisement', advertisementSchema);
