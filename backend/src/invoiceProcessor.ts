// invoiceProcessor.ts

import callOCRAgent from './ocrAgent';
import { convertCurrency } from './currencyRate';

/**
 * Helper to remove code fences if present.
 */
function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w+)?\s*([\s\S]*?)```/g, '$2').trim();
}

/**
 * Helper to format a number into Indonesian Rupiah (PUEBI rules)
 * with dot as thousand separators and a comma before the cents.
 * For example: "Rp1.234.567,00"
 */
function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
  }).format(amount).replace(/\s/g, '');
  console.log('[FORMAT] Formatted Rupiah:', formatted);
  return formatted;
}

/**
 * Helper to parse an Indonesian Rupiah formatted string (e.g., "Rp1.234.567,00") into a number.
 */
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
- "invoiceDate" and "dueDate" must be in dd/mm/yyyy format, for single digit case add "0" before the number (e.g., "1" becomes "01").
- Extract the "invoiceDate" and "dueDate" from the invoice. If either date cannot be found, return a value of null and set the corresponding date to "00/00/0000". Additionally, if either date is present but formatted as "xx/xx/xxxx" (indicating missing or placeholder information), override it by setting the date to "00/00/0000" or similar.
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
      if (parsedData.currencyCode !== "IDR") {
        // Save the original currency code.
        parsedData.originalCurrencyCode = parsedData.currencyCode;
        
        // Remove any currency sign and non-numeric characters except comma and period.
        let amountString = parsedData.totalAmount.replace(/[^0-9.,]/g, '');
        
        // If a period exists, assume it is the decimal separator and remove thousand-separating commas.
        if (amountString.indexOf('.') !== -1) {
          amountString = amountString.replace(/,/g, '');
        } else {
          // Otherwise, assume the comma is the decimal separator: replace it with a period for numeric conversion.
          amountString = amountString.replace(/,/g, '.');
        }
        
        const numericValue = parseFloat(amountString);
        
        try {
          // Attempt to convert using the Frankfurter API.
          const convertedValue = await convertCurrency(parsedData.currencyCode, "IDR", numericValue);
          parsedData.totalAmount = formatRupiah(convertedValue);
          parsedData.currencyCode = "IDR";
        } catch (error) {
          console.warn('[PROCESSOR] Currency conversion failed, using original value:', error);
          // If conversion fails, use the original numeric value formatted as fixed 2 decimals.
          parsedData.totalAmount = numericValue.toFixed(2);
        }
      } else {
        // If already in IDR, correctly parse and format the value.
        const numericValue = parseIDR(parsedData.totalAmount);
        parsedData.totalAmount = formatRupiah(numericValue);
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
