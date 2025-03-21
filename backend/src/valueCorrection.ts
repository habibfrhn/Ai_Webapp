// valueCorrection.ts
import callOCRAgent from './ocrAgent';

export async function correctTotalAmount(totalAmount: string, currencyCode: string): Promise<string> {
  const promptText = `Correct the formatting of the totalAmount value.
Ensure that the value "${totalAmount}" for currency ${currencyCode} is written in the standard format for that currency.
Return a valid JSON object with exactly one key "totalAmount" whose value is the corrected string.
Do not alter the numerical value, only adjust the formatting. Don't include any currency symbols like "$" or "€" or something similar or abreviation like "Rp".
If the input is already in the correct format, return it as is in the JSON.`;

  try {
    const ocrResponse = await callOCRAgent({ text: promptText });
    const messageContent = ocrResponse?.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.warn('[VALUE CORRECTION] No message content returned from OCR Agent.');
      return totalAmount;
    }
    // Remove code fences and trim
    const cleaned = messageContent.replace(/```/g, '').trim();
    // Attempt to extract the JSON object from the response
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      console.warn('[VALUE CORRECTION] Unable to locate JSON object in OCR response, returning original value.');
      return totalAmount;
    }
    const jsonString = cleaned.substring(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.totalAmount === 'string') {
      return parsed.totalAmount;
    } else {
      console.warn('[VALUE CORRECTION] JSON did not contain a valid totalAmount key, returning original value.');
      return totalAmount;
    }
  } catch (error) {
    console.error('[VALUE CORRECTION] Error during correction:', error);
    return totalAmount;
  }
}
