import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { processInvoiceImage } from './invoiceProcessor';

const app = express();
app.use(cors());

// Serve the 'uploads' folder so the client can display the image
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const port = process.env.PORT || 3000;
const upload = multer({ dest: path.join(__dirname, '../uploads') });

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

app.post('/api/invoice/upload', upload.single('invoiceImage'), async (req: MulterRequest, res: Response) => {
  console.log('[SERVER] /api/invoice/upload called');
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }
    console.log(`[SERVER] File uploaded: ${req.file.originalname} stored at ${req.file.path}`);

    const result = await processInvoiceImage(req.file.path);
    if (result.success) {
      console.log('[SERVER] Invoice processing successful:', result.data);
      // Return the extracted data + the uploaded filename
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

app.listen(port, () => {
  console.log(`[SERVER] Running on http://localhost:${port}`);
});
