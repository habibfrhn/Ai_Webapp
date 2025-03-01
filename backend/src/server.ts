import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
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

  // Authentication middleware.
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

  // Invoice upload route.
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

        // Get the user's company name.
        const user = await UserModel.findById((req as any).userId);
        if (!user) {
          res.status(401).json({ success: false, message: 'User not found' });
          return;
        }
        const userCompany = user.companyName;

        // Process the invoice image.
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

  // Endpoint to save a new invoice.
  app.post(
    '/api/invoice/save',
    authenticate,
    async (req: Request, res: Response): Promise<void> => {
      console.log('[SERVER] /api/invoice/save called');
      try {
        const invoiceData = req.body;
        // Read the image file from the uploads folder
        const imagePath = path.join(__dirname, '../uploads', invoiceData.fileName);
        const imageBuffer = fs.readFileSync(imagePath);

        const newInvoice = new InvoiceModel({
          ...invoiceData,
          userId: (req as any).userId,
          invoiceImage: imageBuffer,
        });
        await newInvoice.save();
        res.json({ success: true, message: 'Invoice saved successfully', invoice: newInvoice });
      } catch (err: any) {
        console.error('[SERVER] Error saving invoice:', err);
        res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  // Endpoint to update an existing invoice.
  app.put('/api/invoice/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoiceId = req.params.id;
      const updatedData = req.body;
      // If fileName is provided, update the invoice image as well.
      if (updatedData.fileName) {
        const imagePath = path.join(__dirname, '../uploads', updatedData.fileName);
        updatedData.invoiceImage = fs.readFileSync(imagePath);
      }
      const invoice = await InvoiceModel.findByIdAndUpdate(invoiceId, updatedData, { new: true });
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.json({ success: true, message: 'Invoice updated successfully', invoice });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to list invoices for the logged-in user.
  app.get('/api/invoice/list', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const invoices = await InvoiceModel.find({ userId }).select(
        'invoiceNumber buyerName invoiceDate dueDate invoiceType totalAmount buyerAddress buyerPhone buyerEmail sellerName'
      );
      res.json({ success: true, invoices });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to get full details of a specific invoice.
  app.get('/api/invoice/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoiceId = req.params.id;
      const invoice = await InvoiceModel.findById(invoiceId);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.json({ success: true, invoice });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to delete a single invoice.
  app.delete('/api/invoice/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoiceId = req.params.id;
      const invoice = await InvoiceModel.findByIdAndDelete(invoiceId);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.json({ success: true, message: 'Invoice deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to delete multiple invoices.
  app.delete('/api/invoice', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const { invoiceIds } = req.body;
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({ success: false, message: 'No invoice IDs provided' });
        return;
      }
      const result = await InvoiceModel.deleteMany({ _id: { $in: invoiceIds } });
      res.json({ success: true, message: `${result.deletedCount} invoices deleted successfully` });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER INIT ERROR]', err);
});
