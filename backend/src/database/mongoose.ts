// ===============================
// backend/src/database/mongoose.ts (FULL UPDATED CODE)
// ===============================
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI as string;

export async function connectDB(): Promise<void> {
  console.log('[DB] Attempting to connect to MongoDB at:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[DB] Connected to MongoDB:', MONGO_URI);
  } catch (err) {
    console.error('[DB] Connection error:', err);
    process.exit(1);
  }
}
