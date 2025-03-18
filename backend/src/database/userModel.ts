// database/userModel.ts
import { Schema } from 'mongoose';
import { authDB } from './mongoose';

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

export const UserModel = authDB.model<IUserDoc>('User', userSchema);
