// backend/src/server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { connectDB } from '../src/database/mongoose';
import authRoutes from '../src/authentication/authRoutes';
import { processInvoiceImage } from '../src/invoiceProcessor';
import { UserModel } from '../src/database/userModel';
import { InvoiceModel } from '../src/database/invoiceModel';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

async function startServer() {
  console.log('[SERVER] Initializing...');

  console.log('[SERVER] Connecting to MongoDB...');
  await connectDB();
  console.log('[SERVER] MongoDB connection established.');

  const app = express();
  app.use(cors());
  app.use(express.json());

  console.log('[SERVER] Serving /uploads folder...');
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  console.log('[SERVER] Mounting /api/auth routes...');
  app.use('/api/auth', authRoutes);

  // Authentication middleware using proper types.
  function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ success: false, message: 'Missing authorization header' });
      return;
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      (req as any).userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }

  console.log('[SERVER] Setting up invoice upload route...');
  const upload = multer({ dest: path.join(__dirname, '../uploads') });

  // Invoice upload route (protected by authentication)
  app.post(
    '/api/invoice/upload',
    authenticate,
    upload.single('invoiceImage'),
    async (req: Request, res: Response): Promise<void> => {
      console.log('[SERVER] /api/invoice/upload called');
      try {
        if (!req.file) {
          console.warn('[SERVER] No file in request');
          res.status(400).json({ success: false, message: 'No file uploaded' });
          return;
        }
        console.log(
          `[SERVER] File uploaded: ${req.file.originalname} stored at ${req.file.path}`
        );

        // Retrieve the logged-in user's company name.
        const user = await UserModel.findById((req as any).userId);
        if (!user) {
          res.status(401).json({ success: false, message: 'User not found' });
          return;
        }
        const userCompany = user.companyName;

        // Process the invoice image, passing the user's company name for categorization.
        const result = await processInvoiceImage(req.file.path, userCompany);
        if (result.success) {
          console.log('[SERVER] Invoice processing successful:', result.data);
          res.json({
            success: true,
            extractedData: result.data,
            fileName: req.file.filename,
          });
          return;
        } else {
          console.error('[SERVER] Invoice processing failed:', result.message);
          res.status(500).json({ success: false, message: result.message });
          return;
        }
      } catch (err: any) {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  // Route to save the updated invoice data to MongoDB.
  app.post(
    '/api/invoice/save',
    authenticate,
    async (req: Request, res: Response): Promise<void> => {
      console.log('[SERVER] /api/invoice/save called');
      try {
        const invoiceData = req.body;
        // Create a new invoice record associated with the logged-in user.
        const newInvoice = new InvoiceModel({
          ...invoiceData,
          userId: (req as any).userId,
        });
        await newInvoice.save();
        res.json({
          success: true,
          message: 'Invoice saved successfully',
          invoice: newInvoice,
        });
      } catch (err: any) {
        console.error('[SERVER] Error saving invoice:', err);
        res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER INIT ERROR]', err);
});
