import { Document, Model, Schema, Types, model } from 'mongoose';

export interface IVisit extends Document {
  client_id: Types.ObjectId;
  place_id: Types.ObjectId;
  points_awarded: boolean;
  createdAt: Date;
}

const visitSchema = new Schema<IVisit>(
  {
    client_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    place_id: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
    points_awarded: { type: Boolean, default: false }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const Visit: Model<IVisit> = model<IVisit>('Visit', visitSchema);
