// CHANGED in userModel.ts
// (Rename local 'User' to something else to avoid merged declaration conflicts)

import { Schema, model } from 'mongoose';

export interface IUserDoc {
  email: string;
  passwordHash: string;
}

const userSchema = new Schema<IUserDoc>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { collection: 'users' }
);

// Rename model export to 'UserModel'
export const UserModel = model<IUserDoc>('User', userSchema);
