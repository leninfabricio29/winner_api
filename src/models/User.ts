import { Document, Model, Schema, model } from 'mongoose';

export type UserRole = 'super_admin' | 'business' | 'client';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface IUser extends Document {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  ci?: string;
  fcm_token?: string;
  avatar_url?: string;
  referral_code?: string;
  referral_used?: string;
  points_balance?: number;
  ruc?: string;
  business_name?: string;
  business_category?: string;
  reset_password_token?: string;
  reset_password_expires_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['super_admin', 'business', 'client'],
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'deleted'],
      default: 'active'
    },
    fcm_token: { type: String, trim: true },
    ci: { type: String, trim: true },
    referral_code: { type: String, trim: true, unique: true, sparse: true },
    referral_used: { type: String, trim: true },
    points_balance: { type: Number, default: 0 },
    ruc: { type: String, trim: true },
    business_name: { type: String, trim: true },
    business_category: { type: String, trim: true },
    avatar_url: { type: String, trim: true },
    reset_password_token: { type: String },
    reset_password_expires_at: { type: Date }
  },
  {
    timestamps: true
  }
);

export const User: Model<IUser> = model<IUser>('User', userSchema);
