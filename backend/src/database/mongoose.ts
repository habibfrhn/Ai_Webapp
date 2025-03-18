// database/mongoose.ts
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_AUTH_URI = process.env.MONGO_AUTH_URI;
const MONGO_INVOICE_URI = process.env.MONGO_INVOICE_URI;

if (!MONGO_AUTH_URI || !MONGO_INVOICE_URI) {
  console.error("Missing MongoDB connection URIs in .env");
  process.exit(1);
}

// Create separate connections
export const authDB = mongoose.createConnection(MONGO_AUTH_URI);
export const invoiceDB = mongoose.createConnection(MONGO_INVOICE_URI);

// Wait for both connections to be established
export async function connectDB(): Promise<void> {
  console.log('[DB] Connecting to Auth and Invoice databases...');
  const authPromise = new Promise((resolve, reject) => {
    authDB.once('open', resolve);
    authDB.on('error', reject);
  });
  const invoicePromise = new Promise((resolve, reject) => {
    invoiceDB.once('open', resolve);
    invoiceDB.on('error', reject);
  });
  await Promise.all([authPromise, invoicePromise]);
  console.log('[DB] Connected to both Auth and Invoice databases.');
}
