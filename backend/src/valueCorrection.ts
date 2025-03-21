// valueCorrection.ts
import callOCRAgent from './ocrAgent';

function getRegexPattern(currencyCode: string): RegExp | null {
  const code = currencyCode.toUpperCase();
  if (code === 'IDR') {
    // IDR: thousand separator dot, decimal separator comma, optional decimals.
    return /^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$/;
  }
  if (code === 'JPY') {
    // JPY: typically no decimals, thousand separator comma.
    return /^\d{1,3}(?:,\d{3})*$/;
  }
  // For currencies like USD, EUR, GBP, CNY, INR:
  const commaDecimalCurrencies = ['USD', 'EUR', 'GBP', 'CNY', 'INR'];
  if (commaDecimalCurrencies.includes(code)) {
    return /^\d{1,3}(?:,\d{3})*(?:\.\d{2})?$/;
  }
  // Currency not recognized.
  return null;
}

export async function correctTotalAmount(totalAmount: string, currencyCode: string): Promise<string> {
  const pattern = getRegexPattern(currencyCode);
  
  // If no pattern is defined for this currency, pass the value as is.
  if (!pattern) {
    console.log(`[VALUE CORRECTION] No formatting pattern defined for currency ${currencyCode}. Passing value as is.`);
    return totalAmount;
  }
  
  // If the totalAmount already matches the correct format for this currency, return it directly.
  if (pattern.test(totalAmount)) {
    console.log(`[VALUE CORRECTION] Total amount is already correctly formatted for ${currencyCode}:`, totalAmount);
    return totalAmount;
  }

  // Otherwise, proceed with formatting via the OCR agent.
  const promptText = `Correct the formatting of the totalAmount value.
Ensure that the value "${totalAmount}" for currency ${currencyCode} is written in the standard format for that currency.
Return a valid JSON object with exactly one key "totalAmount" whose value is the corrected string.
Do not alter the numerical value, only adjust the formatting. Don't include any currency symbols like "$" or "€" or abbreviation like "Rp".
If the input is already in the correct format, return it as is in the JSON.`;

  try {
    const ocrResponse = await callOCRAgent({ text: promptText });
    const messageContent = ocrResponse?.choices?.[0]?.message?.content;
    if (!messageContent) {
      console.warn('[VALUE CORRECTION] No message content returned from OCR Agent.');
      return totalAmount;
    }
    // Remove code fences if present and trim.
    const cleaned = messageContent.replace(/```/g, '').trim();
    // Locate JSON object in the response.
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
