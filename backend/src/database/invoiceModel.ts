// database/invoiceModel.ts
import { Schema } from 'mongoose';
import { invoiceDB } from './mongoose';

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
  finalTotalAmount: string | null;
  currencyCode: string;
  invoiceType: 'Faktur masuk' | 'Faktur keluar' | null;
  fileName: string;
  invoiceImages: Buffer[];
  createdAt: Date;
  status: 'Belum diproses' | 'Sedang diproses' | 'Telah diproses';
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
  finalTotalAmount: { type: String, default: null },
  currencyCode: { type: String, required: true, match: /^[A-Z]{3}$/ },
  invoiceType: {
    type: String,
    enum: ['Faktur masuk', 'Faktur keluar'],
    default: null,
  },
  fileName: { type: String, required: true },
  invoiceImages: { type: [Buffer], required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['Belum diproses', 'Sedang diproses', 'Telah diproses'],
    default: 'Belum diproses',
  },
}, { collection: 'invoices' });

export const InvoiceModel = invoiceDB.model<IInvoice>('Invoice', invoiceSchema);
