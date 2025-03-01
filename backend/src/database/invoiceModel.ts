import { Schema, model } from 'mongoose';

export interface IInvoice {
  userId: Schema.Types.ObjectId;
  sellerName: string | null;
  buyerName: string | null;
  buyerAddress: string | null;
  buyerPhone: string | null;
  buyerEmail: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  taxDetails: string | null;
  totalAmount: string | null;
  invoiceType: string | null; // "Faktur masuk" or "Faktur keluar"
  fileName: string;
  invoiceImage: Buffer;
  createdAt: Date;
}

const invoiceSchema = new Schema<IInvoice>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sellerName: { type: String, default: null },
  buyerName: { type: String, default: null },
  buyerAddress: { type: String, default: null },
  buyerPhone: { type: String, default: null },
  buyerEmail: { type: String, default: null },
  invoiceNumber: { type: String, default: null },
  invoiceDate: { type: String, default: null },
  dueDate: { type: String, default: null },
  taxDetails: { type: String, default: null },
  totalAmount: { type: String, default: null },
  invoiceType: { type: String, default: null },
  fileName: { type: String, required: true },
  invoiceImage: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const InvoiceModel = model<IInvoice>('Invoice', invoiceSchema);
