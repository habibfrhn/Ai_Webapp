// backend/tempCleanup.ts
import { InvoiceModel } from './invoiceModel';

export async function cleanupTempInvoices(userId: string): Promise<number> {
  try {
    const result = await InvoiceModel.deleteMany({ userId, temporary: true });
    console.info(`[BACKEND] Cleanup deleted ${result.deletedCount} temporary invoices for user ${userId}`);
    return result.deletedCount || 0;
  } catch (error: any) {
    console.error('[BACKEND] Cleanup error:', error);
    throw new Error(error.message);
  }
}
