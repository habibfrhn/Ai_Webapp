import { Schema, model } from 'mongoose';

export interface IInvoice {
  userId: Schema.Types.ObjectId;

  sellerName: string | null;
  sellerAddress: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  sellerTaxId: string | null;

  buyerName: string | null;
  buyerAddress: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  buyerTaxId: string | null;

  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  taxDetails: string | null;
  totalAmount: string | null;

  invoiceType: 'Faktur masuk' | 'Faktur keluar' | null; // "Faktur masuk" or "Faktur keluar"
  fileName: string;
  invoiceImage: Buffer;

  createdAt: Date;
  createdTime: string; // e.g. "14:05"
  status: 'Belum diproses' | 'Sedang diproses' | 'Telah diproses';
  temporary: boolean;
}

const invoiceSchema = new Schema<IInvoice>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

  sellerName: { type: String, default: null },
  sellerAddress: { type: String, default: null },
  sellerPhone: { type: String, default: null },
  sellerEmail: { type: String, default: null },
  sellerTaxId: { type: String, default: null },

  buyerName: { type: String, default: null },
  buyerAddress: { type: String, default: null },
  buyerPhone: { type: String, default: null },
  buyerEmail: { type: String, default: null },
  buyerTaxId: { type: String, default: null },

  invoiceNumber: { type: String, default: null },
  invoiceDate: { type: String, default: null },
  dueDate: { type: String, default: null },
  taxDetails: { type: String, default: null },
  totalAmount: { type: String, default: null },

  invoiceType: {
    type: String,
    enum: ['Faktur masuk', 'Faktur keluar'],
    default: null,
  },

  fileName: { type: String, required: true },
  invoiceImage: { type: Buffer, required: true },

  createdAt: { type: Date, default: Date.now },

  // Store time in hh:mm
  createdTime: { type: String, default: '' },

  // Restrict status to 3 options, default is "Belum diproses"
  status: {
    type: String,
    enum: ['Belum diproses', 'Sedang diproses', 'Telah diproses'],
    default: 'Belum diproses',
  },

  // draft/final
  temporary: { type: Boolean, default: true },
});

export const InvoiceModel = model<IInvoice>('Invoice', invoiceSchema);
