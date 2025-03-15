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

  // Updated Invoice upload route to support multiple images and grouping mode.
  app.post(
    '/api/invoice/upload',
    authenticate,
    upload.array('invoiceImage'),
    async (req: Request, res: Response): Promise<void> => {
      console.log('[SERVER] /api/invoice/upload called');
      try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
          console.warn('[SERVER] No file in request');
          res.status(400).json({ success: false, message: 'No file uploaded' });
          return;
        }

        // Check grouping mode: "multiple" means separate invoices; default is single invoice.
        const invoiceGrouping = req.body.invoiceGrouping === 'multiple' ? 'multiple' : 'single';

        const user = await UserModel.findById((req as any).userId);
        if (!user) {
          res.status(401).json({ success: false, message: 'User not found' });
          return;
        }
        const userCompany = user.companyName;

        // Helper function to create an invoice record.
        async function createInvoiceRecord(
          processedData: any,
          invoiceImageBuffers: Buffer[],
          originalFileName: string
        ) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const createdTime = `${hh}:${mm}`;
          const newInvoice = new InvoiceModel({
            ...processedData,
            userId: (req as any).userId,
            temporary: true,
            invoiceImages: invoiceImageBuffers,
            fileName: originalFileName,
            status: 'Belum diproses',
            createdTime,
          });
          await newInvoice.save();
          return newInvoice;
        }

        if (invoiceGrouping === 'single') {
          // All files belong to one invoice.
          let invoiceImageBuffers: Buffer[] = [];
          let extractionBuffer: Buffer;

          // If a PDF is uploaded, we expect only one file.
          if (files.length === 1 && files[0].mimetype === 'application/pdf') {
            const file = files[0];
            const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`);
            fs.writeFileSync(tempFilePath, file.buffer);
            console.log("Temporary PDF file created at:", tempFilePath);
            try {
              const imageBuffers = await convertPDFToImages(tempFilePath);
              if (imageBuffers.length === 0) {
                throw new Error("PDF conversion returned no images");
              }
              extractionBuffer = await optimizeImage(imageBuffers[0]);
              invoiceImageBuffers = await Promise.all(
                imageBuffers.map(async (buf) => await optimizeImage(buf))
              );
            } catch (error: any) {
              console.error("Error during PDF conversion:", error);
              res.status(500).json({ success: false, message: "PDF conversion failed: " + error.message });
              return;
            } finally {
              try {
                fs.unlinkSync(tempFilePath);
                console.log("Temporary file removed:", tempFilePath);
              } catch (e) {
                console.error("Error cleaning up temporary file:", e);
              }
            }
          } else {
            // For multiple image files, optimize each and use the first for OCR extraction.
            invoiceImageBuffers = await Promise.all(
              files.map(async (file) => {
                if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
                  throw new Error('Unsupported file format in single invoice mode.');
                }
                return await optimizeImage(file.buffer);
              })
            );
            extractionBuffer = invoiceImageBuffers[0];
          }

          const result = await processInvoiceImage(extractionBuffer, userCompany);
          if (!result.success) {
            console.error('[SERVER] Invoice processing failed:', result.message);
            res.status(500).json({ success: false, message: result.message });
            return;
          }

          const newInvoice = await createInvoiceRecord(result.data, invoiceImageBuffers, files[0].originalname);
          res.json({
            success: true,
            invoiceId: newInvoice._id,
            extractedData: result.data,
          });
        } else {
          // "multiple" mode: each file is processed as a separate invoice.
          let invoicesArray: any[] = [];
          for (const file of files) {
            const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
              console.warn(`[SERVER] Unsupported file format for file ${file.originalname}`);
              continue;
            }

            let invoiceImageBuffers: Buffer[] = [];
            let extractionBuffer: Buffer;

            if (file.mimetype === 'application/pdf') {
              const tempFilePath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`);
              fs.writeFileSync(tempFilePath, file.buffer);
              console.log("Temporary PDF file created at:", tempFilePath);
              try {
                const imageBuffers = await convertPDFToImages(tempFilePath);
                if (imageBuffers.length === 0) {
                  throw new Error("PDF conversion returned no images");
                }
                extractionBuffer = await optimizeImage(imageBuffers[0]);
                invoiceImageBuffers = await Promise.all(
                  imageBuffers.map(async (buf) => await optimizeImage(buf))
                );
              } catch (error: any) {
                console.error("Error during PDF conversion for file", file.originalname, error);
                continue;
              } finally {
                try {
                  fs.unlinkSync(tempFilePath);
                  console.log("Temporary file removed:", tempFilePath);
                } catch (e) {
                  console.error("Error cleaning up temporary file:", e);
                }
              }
            } else {
              const optimizedBuffer = await optimizeImage(file.buffer);
              extractionBuffer = optimizedBuffer;
              invoiceImageBuffers = [optimizedBuffer];
            }

            const result = await processInvoiceImage(extractionBuffer, userCompany);
            if (!result.success) {
              console.error('[SERVER] Invoice processing failed for file', file.originalname, result.message);
              continue;
            }

            const newInvoice = await createInvoiceRecord(result.data, invoiceImageBuffers, file.originalname);
            invoicesArray.push({ invoiceId: newInvoice._id, extractedData: result.data });
          }

          if (invoicesArray.length === 0) {
            res.status(500).json({ success: false, message: 'No invoices were processed successfully.' });
            return;
          }

          res.json({
            success: true,
            invoices: invoicesArray,
          });
        }
      } catch (err: any) {
        console.error('[SERVER ERROR]', err);
        res.status(500).json({ success: false, message: err.message });
      }
    }
  );

  // Other endpoints remain unchanged.
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
