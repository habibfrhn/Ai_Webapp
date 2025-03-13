// server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import fs from "fs";
import os from "os";
import path from "path";
import { connectDB } from './database/mongoose';
import authRoutes from './authentication/authRoutes';
import { processInvoiceImage } from './invoiceProcessor';
import { UserModel } from './database/userModel';
import { InvoiceModel } from './database/invoiceModel';
import { cleanupTempInvoices } from './database/tempCleanup';
import { convertPDFToImages } from './pdfConverter';
import { optimizeImage } from './imageOptimizer';

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

  // Use memory storage so that files are kept in memory.
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

        // Allow only PDF, PNG, and JPEG files.
        const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          res.status(400).json({ success: false, message: 'Unsupported file format. Please upload a PDF, PNG, or JPG file.' });
          return;
        }

        const user = await UserModel.findById((req as any).userId);
        if (!user) {
          res.status(401).json({ success: false, message: 'User not found' });
          return;
        }
        const userCompany = user.companyName;

        let invoiceImageBuffers: Buffer[];
        let extractionBuffer: Buffer;

        if (req.file.mimetype === 'application/pdf') {
          // Write PDF buffer to a temporary file.
          const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${req.file.originalname}`);
          fs.writeFileSync(tempFilePath, req.file.buffer);
          console.log("Temporary PDF file created at:", tempFilePath);

          try {
            // Convert the PDF into an array of image buffers.
            const imageBuffers = await convertPDFToImages(tempFilePath);
            console.log("Converted PDF to", imageBuffers.length, "images.");
            if (imageBuffers.length === 0) {
              throw new Error("PDF conversion returned no images");
            }
            // Use the first page for OCR extraction.
            extractionBuffer = await optimizeImage(imageBuffers[0]);
            // Optimize all pages for storage.
            invoiceImageBuffers = await Promise.all(
              imageBuffers.map(async (buf) => {
                const optimized = await optimizeImage(buf);
                return optimized;
              })
            );
          } catch (error: any) {
            console.error("Error during PDF conversion:", error);
            res.status(500).json({ success: false, message: "PDF conversion failed: " + error.message });
            return;
          } finally {
            // Cleanup the temporary file.
            try {
              fs.unlinkSync(tempFilePath);
              console.log("Temporary file removed:", tempFilePath);
            } catch (e) {
              console.error("Error cleaning up temporary file:", e);
            }
          }
        } else {
          // For image files, optimize and wrap in an array.
          const optimizedBuffer = await optimizeImage(req.file.buffer);
          extractionBuffer = optimizedBuffer;
          invoiceImageBuffers = [optimizedBuffer];
        }

        // Process the invoice image using the first image buffer.
        const result = await processInvoiceImage(extractionBuffer, userCompany);
        if (!result.success) {
          console.error('[SERVER] Invoice processing failed:', result.message);
          res.status(500).json({ success: false, message: result.message });
          return;
        }

        // Build createdTime in hh:mm format.
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const createdTime = `${hh}:${mm}`;

        // Create a temporary invoice record storing all page images.
        const newInvoice = new InvoiceModel({
          ...result.data,
          userId: (req as any).userId,
          temporary: true,
          invoiceImages: invoiceImageBuffers,
          fileName: req.file.originalname,
          status: 'Belum diproses',
          createdTime,
        });
        await newInvoice.save();
        console.log("Invoice record created with ID:", newInvoice._id);

        res.json({
          success: true,
          invoiceId: newInvoice._id,
          extractedData: result.data,
        });
        return;
      } catch (err: any) {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  // Endpoint to finalize the invoice.
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

  // Endpoint to serve a specific page of the temporary invoice image.
  app.get('/api/invoice/temp/:id/image', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const invoice = await InvoiceModel.findById(req.params.id);
      if (!invoice || !invoice.invoiceImages || invoice.invoiceImages.length === 0) {
        res.status(404).send('Image not found');
        return;
      }
      let page = parseInt(req.query.page as string, 10);
      if (isNaN(page) || page < 0 || page >= invoice.invoiceImages.length) {
        page = 0;
      }
      res.set('Content-Type', 'image/jpeg');
      res.send(invoice.invoiceImages[page]);
      return;
    } catch (err: any) {
      res.status(500).send(err.message);
    }
  });

  // Additional endpoints (cleanup, delete, list, etc.) remain unchanged.
  app.delete('/api/invoice/temp/cleanup-all', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const count = await cleanupTempInvoices(userId);
      res.json({ success: true, message: `${count} temporary invoices cleaned up successfully.` });
    } catch (err: any) {
      console.error('[SERVER] Cleanup endpoint error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });

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

  app.get('/api/invoice/list', authenticate, async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const invoices = await InvoiceModel.find({ userId, temporary: false }).select(
        'invoiceNumber buyerName invoiceDate dueDate invoiceType totalAmount buyerAddress buyerPhone buyerEmail sellerName currencyCode'
      );
      res.json({ success: true, invoices });
      return;
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

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

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER INIT ERROR]', err);
});
