import { extractTextFromImage } from './tesseract';
import { callDeepSeek } from './artificialBrain';

// Helper to remove code fences if present.
function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w+)?\s*([\s\S]*?)```/g, '$2').trim();
}

/**
 * Processes the invoice image.
 * @param fileBuffer - Buffer of the uploaded image.
 * @param userCompany - The company name of the logged in user.
 * @returns An object with a success flag and extracted data.
 */
export async function processInvoiceImage(fileBuffer: Buffer, userCompany: string) {
  console.log('[PROCESSOR] Starting invoice processing for buffer');

  try {
    const { rawText } = await extractTextFromImage(fileBuffer);
    console.log('[PROCESSOR] OCR rawText length:', rawText.length);

    // Updated prompt with new fields
    const deepseekPrompt = 
`Below is the OCR text of an invoice. Return only JSON (no code blocks) with these exact keys:

{
  "sellerName": ...,
  "sellerAddress": ...,
  "sellerPhone": ...,
  "sellerEmail": ...,
  "sellerTaxId": ...,
  "buyerName": ...,
  "buyerAddress": ...,
  "buyerPhone": ...,
  "buyerEmail": ...,
  "buyerTaxId": ...,
  "invoiceNumber": ...,
  "invoiceDate": ...,
  "dueDate": ...,
  "taxDetails": ...,
  "totalAmount": ...,
  "invoiceType": ...
}

Invoice categorization:
- If the sellerName matches our company name "${userCompany}", then invoiceType is "Faktur keluar".
- Otherwise, invoiceType is "Faktur masuk".

Note:
- Buyer information (buyerName, buyerAddress, buyerPhone, buyerEmail, buyerTaxId) usually appears together in one section.
- If any buyer detail (e.g., a phone number or address) appears far from the other buyer fields, it could be part of the seller’s information. Use reasoning to determine the correct assignment.
- If a field is missing, set it to null.
- For "invoiceDate" and "dueDate", use dd/mm/yyyy only.
- "taxDetails" should be a percentage only (e.g., "10%").
- "invoiceType" can only be "Faktur masuk" or "Faktur keluar".

Do not add any disclaimers or extra text. Just valid JSON.

OCR TEXT:
${rawText}
`;

    console.log('[PROCESSOR] Sending prompt to DeepSeek...');
    const deepseekResult = await callDeepSeek(deepseekPrompt);
    console.log('[PROCESSOR] Raw DeepSeek output:', deepseekResult);

    const cleaned = stripCodeBlocks(deepseekResult);

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
