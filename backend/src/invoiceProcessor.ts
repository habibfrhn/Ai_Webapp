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
 * with dot as thousand separators and a comma for decimals.
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
  cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
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
    // Notice the updated instructions for totalAmount extraction.
    const promptText = 
`Below is an invoice image. Extract the following fields and return valid JSON (no code blocks) with exactly these keys:
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
- Extract the "totalAmount" as a plain numeric value without any thousand separators or currency symbols.
  For example, if the invoice shows Rupiah as "Rp1.000.000" extract it as "1000000". 
  If the invoice shows dollars as "9,999,999.99", extract it as "9999999,99" (using a comma as the decimal separator).
- Extract the "currencyCode" as a 3-letter uppercase code representing the original currency.
- For taxDetails:
  - If a tax percentage is provided, output it in the format "10%" only.
  - If only a tax amount is provided, calculate the percentage as (tax amount / total amount * 100)% and append the "%" symbol.
  - If neither is provided, set taxDetails to null.
  - If there is more than 1 tax detail in a section, combine them into a single string.
- For invoiceDate and dueDate:
  - They must be in dd/mm/yyyy format with leading zeros for single digits.
  - If not found or if placeholder data is found (e.g., "xx/xx/xxxx"), return null.
- The address should be in a single line: "Street, City, Postal Code, Country".
- Do not add any extra text or disclaimers.
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
    
    // Process the totalAmount and create finalTotalAmount.
    if (parsedData.currencyCode && parsedData.totalAmount !== undefined) {
      // Convert totalAmount to a string to safely use replace.
      let amountString = String(parsedData.totalAmount).replace(/[^0-9.,]/g, '');

      let originalAmountNumeric: number;
      if (parsedData.currencyCode === "IDR") {
        // For IDR, assume thousand separator is dot and decimal separator is comma.
        // Remove dots then replace comma with dot.
        let cleaned = amountString.replace(/\./g, '').replace(/,/g, '.');
        originalAmountNumeric = parseFloat(cleaned);
        // Store original value as an integer string.
        parsedData.totalAmount = Math.round(originalAmountNumeric).toString();
      } else {
        // For non-IDR, assume thousand separator is comma and decimal separator is period.
        let cleaned = amountString.replace(/,/g, '');
        originalAmountNumeric = parseFloat(cleaned);
        // Store original value with two decimals and comma as the decimal separator.
        parsedData.totalAmount = originalAmountNumeric.toFixed(2).replace('.', ',');
      }
      
      // Compute finalTotalAmount in IDR.
      let finalAmountNumeric: number;
      if (parsedData.currencyCode === "IDR") {
        finalAmountNumeric = originalAmountNumeric;
      } else {
        try {
          finalAmountNumeric = await convertCurrency(parsedData.currencyCode, "IDR", originalAmountNumeric);
        } catch (error) {
          console.warn('[PROCESSOR] Currency conversion failed, falling back to 1:1 conversion');
          finalAmountNumeric = originalAmountNumeric;
        }
      }
      // Rupiah are integer values.
      finalAmountNumeric = Math.round(finalAmountNumeric);
      parsedData.finalTotalAmount = finalAmountNumeric.toString();
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
