// ===============================
// backend/src/database/userModel.ts (FULL UPDATED CODE)
// ===============================
import { Schema, model } from 'mongoose';

export interface IUserDoc {
  email: string;
  passwordHash: string;
  companyName: string;
}

const userSchema = new Schema<IUserDoc>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    companyName: { type: String, required: true },
  },
  { collection: 'users' }
);

export const UserModel = model<IUserDoc>('User', userSchema);
