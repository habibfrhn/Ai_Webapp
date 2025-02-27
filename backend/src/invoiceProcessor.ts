// ===============================
// backend/src/invoiceProcessor.ts (FULL UPDATED CODE)
// ===============================
import { extractTextFromImage } from './textract';
import { callDeepSeek } from './artificialBrain';

// A small helper to remove any triple-backtick code fences
function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w+)?\s*([\s\S]*?)```/g, '$2').trim();
}

export async function processInvoiceImage(filePath: string) {
  console.log('[PROCESSOR] Starting invoice processing for:', filePath);

  try {
    const { rawText } = await extractTextFromImage(filePath);
    console.log('[PROCESSOR] OCR rawText length:', rawText.length);

    // CHANGED: Update the prompt so DeepSeek returns the same keys your front-end expects.
    const deepseekPrompt = `
Below is the OCR text of an invoice. Return only JSON (no code blocks) with these exact keys:

{
  "sellerName": ...,
  "buyerName": ...,
  "buyerAddress": ...,
  "buyerPhone": ...,
  "buyerEmail": ...,
  "invoiceNumber": ...,
  "invoiceDate": ...,
  "dueDate": ...,
  "taxDetails": ...,
  "totalAmount": ...
}

If a field is missing, set it to null. 
For "invoiceDate" and "dueDate," use dd/mm/yyyy only. 
"taxDetails" should be a percentage only (e.g., "10%").

Do not add disclaimers or extra text. Just valid JSON.

OCR TEXT:
${rawText}
`;

    console.log('[PROCESSOR] Sending prompt to DeepSeek...');
    const deepseekResult = await callDeepSeek(deepseekPrompt);

    console.log('[PROCESSOR] Raw DeepSeek output:', deepseekResult);

    // Remove code fences if present
    const cleaned = stripCodeBlocks(deepseekResult);

    // Try to parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleaned);
    } catch (err) {
      console.warn('[PROCESSOR] Could not parse JSON. Returning raw text instead.');
      parsedData = { rawDeepSeekOutput: deepseekResult };
    }

    return {
      success: true,
      data: parsedData,
    };
  } catch (error: any) {
    console.error('[PROCESSOR ERROR]', error);
    return {
      success: false,
      data: null,
      message: error.message || 'An error occurred during invoice processing',
    };
  }
}
