// backend/invoiceProcessor.ts

import callOCRAgent from './ocrAgent';
import { convertCurrency } from './currencyRate';

// Removed previous Tesseract and DeepSeek imports.

// Helper to remove code fences if present.
function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w+)?\s*([\s\S]*?)```/g, '$2').trim();
}

// Helper to format a number into Indonesian Rupiah (PUEBI rules) with dot as thousand separators
// and a comma before the cents, for example: "Rp1.234.567,00"
function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(amount).replace(/\s/g, '');
  console.log('[FORMAT] Formatted Rupiah:', formatted);
  return formatted;
}

// Helper to parse an Indonesian Rupiah formatted string (e.g., "Rp1.234.567,00") into a number.
function parseIDR(amountStr: string): number {
  let cleaned = amountStr.replace(/Rp|\s/g, '');
  cleaned = cleaned.replace(/\./g, '');
  cleaned = cleaned.replace(/,/g, '.');
  console.log('[PARSE] Parsed IDR string to number:', cleaned);
  return parseFloat(cleaned);
}

/**
 * Processes the invoice image using the OCR Agent.
 * @param fileBuffer - Buffer of the uploaded image.
 * @param userCompany - The company name of the logged in user.
 * @returns An object with a success flag and extracted data.
 */
export async function processInvoiceImage(fileBuffer: Buffer, userCompany: string) {
  console.log('[PROCESSOR] Starting invoice processing for buffer');

  try {
    // Convert the fileBuffer to a base64 data URL.
    const imageDataUrl = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;

    // Build the prompt text to extract invoice details.
    const promptText = `
Below is an invoice image. Extract the following fields and return valid JSON (no code blocks) with exactly these keys:
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
  "currencyCode": ...,
  "invoiceType": ...
}

Invoice categorization:
- If the sellerName exactly matches "${userCompany}", then set invoiceType to "Faktur keluar".
- Otherwise, set it to "Faktur masuk".

Instructions:
- Identify and return the 3-letter currency code present in the invoice into the "currencyCode".
    -"currencyCode" should be in 3-letter currency in uppercase only.
    -"Rp" is "IDR"
- For taxDetails:
  - If a tax percentage is provided, output it in the format "10%".
  - If only a tax amount is provided, calculate the percentage as (tax amount / total amount * 100)% and append the "%" symbol.
  - If neither is provided, set taxDetails to null.
  - If there is more than 1 tax detail in a section, combine them into a single string.
- For totalAmount:
  - If the currency is IDR, format the value according to Indonesian PUEBI rules (e.g., Rp1.234.567,00).
  - If the currency is not IDR, remove thousand separators and any currency symbols to extract a clean numeric value.
- "invoiceDate" and "dueDate" must be in dd/mm/yyyy format, for single digit case add "0" before the number for example: "1" to "01".
- Note that buyer-related details typically appear together in the invoice, meaning that these fields are located close to one another. In contrast, seller information—especially the company name—commonly appears at both the top and bottom of the invoice, though it may sometimes be grouped in a single section.
- If any required field cannot be found, return its value as null.
- If the correct currency isn't clear, please assume it's in IDR.
- The address should be in a single line of string with this format: "Street, City, Postal Code, Country".

Do not add any extra text or disclaimers.
    `;

    // Call the OCR Agent component with both text prompt and image input.
    const ocrResponse = await callOCRAgent({
      text: promptText,
      imageUrl: imageDataUrl,
    });
    console.log('[PROCESSOR] OCR Agent response:', ocrResponse);

    // Extract the message content from the OCR Agent response.
    const messageContent = ocrResponse?.choices?.[0]?.message?.content;
    if (!messageContent) {
      throw new Error('OCR Agent response does not contain message content.');
    }
    console.log('[PROCESSOR] OCR Agent message content:', messageContent);

    // Remove any code fences if present in the message content.
    const cleanedResponse = stripCodeBlocks(messageContent);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedResponse);
      console.log('[PROCESSOR] Parsed JSON from OCR Agent output:', parsedData);
    } catch (err) {
      console.warn('[PROCESSOR] Could not parse JSON. Returning raw response instead.');
      parsedData = { rawOCRAgentOutput: messageContent };
    }
    
    // Process the totalAmount and currencyCode if available.
    if (parsedData.currencyCode && parsedData.totalAmount) {
      console.log('[PROCESSOR] Found currencyCode and totalAmount:', parsedData.currencyCode, parsedData.totalAmount);
      if (parsedData.currencyCode !== "IDR") {
        // Save the original currency code.
        parsedData.originalCurrencyCode = parsedData.currencyCode;
        console.log('[PROCESSOR] Non-IDR detected. Original currencyCode saved:', parsedData.originalCurrencyCode);
        
        // Remove any currency sign and non-numeric characters except comma and period.
        let amountString = parsedData.totalAmount.replace(/[^0-9.,]/g, '');
        console.log('[PROCESSOR] Cleaned totalAmount string:', amountString);
        
        // If a period exists, assume it is the decimal separator and remove thousand-separating commas.
        if (amountString.indexOf('.') !== -1) {
          amountString = amountString.replace(/,/g, '');
          console.log('[PROCESSOR] Removed thousand-separating commas:', amountString);
        } else {
          // Otherwise, assume the comma is the decimal separator: replace it with a period for numeric conversion.
          amountString = amountString.replace(/,/g, '.');
          console.log('[PROCESSOR] Converted comma to period for decimal conversion:', amountString);
        }
        
        const numericValue = parseFloat(amountString);
        console.log('[PROCESSOR] Numeric value extracted:', numericValue);
        
        // Convert the amount into IDR via the convertCurrency function.
        const convertedValue = await convertCurrency(parsedData.currencyCode, "IDR", numericValue);
        console.log('[PROCESSOR] Converted value in IDR:', convertedValue);
        
        // Format the converted value as "Rpxxx.xxx.xxx,00" according to PUEBI rules.
        parsedData.totalAmount = formatRupiah(convertedValue);
        console.log('[PROCESSOR] Formatted totalAmount in IDR:', parsedData.totalAmount);
        
        // Change the currency code to IDR.
        parsedData.currencyCode = "IDR";
        console.log('[PROCESSOR] Currency code updated to IDR.');
      } else {
        // If already in IDR, correctly parse and format the value.
        const numericValue = parseIDR(parsedData.totalAmount);
        console.log('[PROCESSOR] Numeric value extracted from IDR:', numericValue);
        parsedData.totalAmount = formatRupiah(numericValue);
        console.log('[PROCESSOR] Formatted totalAmount in IDR:', parsedData.totalAmount);
      }
    } else {
      console.log('[PROCESSOR] No totalAmount or currencyCode found in parsed data.');
    }

    console.log('[PROCESSOR] Final parsed data:', parsedData);
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
