import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import { connectDB } from '../src/database/mongoose';
import authRoutes from '../src/authentication/authRoutes';
import { processInvoiceImage } from '../src/invoiceProcessor';
import { UserModel } from '../src/database/userModel';
import { InvoiceModel } from '../src/database/invoiceModel';

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

async function startServer(): Promise<void> {
  console.log('[SERVER] Initializing...');

  console.log('[SERVER] Connecting to MongoDB...');
  await connectDB();
  console.log('[SERVER] MongoDB connection established.');

  const app = express();
  app.use(cors());
  app.use(express.json());

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
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      (req as any).userId = decoded.userId;
      next();
    } catch (err) {
      res.status(401).json({ success: false, message: 'Invalid token' });
    }
  }

  // Use memory storage so that files are kept in memory instead of saved to disk.
  const storage = multer.memoryStorage();
  const upload = multer({ storage });

  // Invoice upload route (creates a temporary invoice).
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
        console.log(`[SERVER] File uploaded: ${req.file.originalname} received in memory`);

        // Get the user's company name.
        const user = await UserModel.findById((req as any).userId);
        if (!user) {
          res.status(401).json({ success: false, message: 'User not found' });
          return;
        }
        const userCompany = user.companyName;

        // Process the invoice image using the in-memory buffer.
        const result = await processInvoiceImage(req.file.buffer, userCompany);
        if (!result.success) {
          console.error('[SERVER] Invoice processing failed:', result.message);
          res.status(500).json({ success: false, message: result.message });
          return;
        }

        console.log('[SERVER] Invoice processing successful:', result.data);

        // Create a temporary invoice record.
        const newInvoice = new InvoiceModel({
          ...result.data,
          userId: (req as any).userId,
          temporary: true,
          invoiceImage: req.file.buffer,
          fileName: req.file.originalname,
        });
        await newInvoice.save();

        res.json({
          success: true,
          invoiceId: newInvoice._id,
          extractedData: result.data,
        });
        return; // or just end without returning anything
      } catch (err: any) {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  // Endpoint to finalize the invoice when the user clicks "Save Invoice".
  app.post('/api/invoice/save', authenticate, async (req: Request, res: Response): Promise<void> => {
    console.log('[SERVER] /api/invoice/save called');
    try {
      const { invoiceId, ...formData } = req.body;
      const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
        invoiceId,
        { ...formData, temporary: false },
        { new: true }
      );
      if (!updatedInvoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.json({ success: true, message: 'Invoice saved successfully', invoice: updatedInvoice });
      return;
    } catch (err: any) {
      console.error('[SERVER] Error saving invoice:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to serve the invoice image from the temporary record.
  app.get('/api/invoice/temp/:id/image', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice?.invoiceImage) {
        res.status(404).send('Image not found');
        return;
      }
      res.set('Content-Type', 'image/jpeg');
      res.send(invoice.invoiceImage);
      return;
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  // Endpoint to delete a temporary invoice (for Cancel or cleanup).
  app.delete('/api/invoice/temp/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoiceId = req.params.id;
      const invoice = await InvoiceModel.findOneAndDelete({ _id: invoiceId, temporary: true });
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Temporary invoice not found' });
        return;
      }
      res.json({ success: true, message: 'Temporary invoice deleted successfully' });
      return;
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // List only finalized (temporary: false) invoices.
  app.get('/api/invoice/list', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const invoices = await InvoiceModel.find({ userId, temporary: false }).select(
        'invoiceNumber buyerName invoiceDate dueDate invoiceType totalAmount buyerAddress buyerPhone buyerEmail sellerName'
      );
      res.json({ success: true, invoices });
      return;
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
      return;
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to delete a finalized invoice.
  app.delete('/api/invoice/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoiceId = req.params.id;
      const invoice = await InvoiceModel.findByIdAndDelete(invoiceId);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }
      res.json({ success: true, message: 'Invoice deleted successfully' });
      return;
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Endpoint to delete multiple finalized invoices.
  app.delete('/api/invoice', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const { invoiceIds } = req.body;
      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        res.status(400).json({ success: false, message: 'No invoice IDs provided' });
        return;
      }
      const result = await InvoiceModel.deleteMany({ _id: { $in: invoiceIds } });
      res.json({ success: true, message: `${result.deletedCount} invoices deleted successfully` });
      return;
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Start listening
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
  });
}

// Start the server
startServer().catch((err) => {
  console.error('[SERVER INIT ERROR]', err);
});
