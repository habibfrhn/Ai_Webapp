// ===============================
// backend/src/server.ts (FULL UPDATED CODE)
// ===============================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { connectDB } from '../src/database/mongoose';
import authRoutes from '../src/authentication/authRoutes';
import { processInvoiceImage } from '../src/invoiceProcessor';

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

  console.log('[SERVER] Setting up invoice upload route...');
  const upload = multer({ dest: path.join(__dirname, '../uploads') });

  app.post('/api/invoice/upload', upload.single('invoiceImage'), async (req, res) => {
    console.log('[SERVER] /api/invoice/upload called');
    try {
      if (!req.file) {
        console.warn('[SERVER] No file in request');
        res.status(400).json({ success: false, message: 'No file uploaded' });
        return;
      }
      console.log(`[SERVER] File uploaded: ${req.file.originalname} stored at ${req.file.path}`);

      const result = await processInvoiceImage(req.file.path);
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
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`[SERVER] Running on http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[SERVER INIT ERROR]', err);
});
