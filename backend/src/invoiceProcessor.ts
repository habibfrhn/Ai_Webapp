// backend/src/invoiceProcessor.ts

import { extractTextFromImage } from './textract';
import { sendToDeepSeek } from './artificialBrain';

// A small helper to remove any triple-backtick code fences
function stripCodeBlocks(text: string): string {
  return text.replace(/```(\w+)?\s*([\s\S]*?)```/g, '$2').trim();
}

export async function processInvoiceImage(filePath: string) {
  console.log('[PROCESSOR] Starting invoice processing for:', filePath);

  try {
    const { rawText } = await extractTextFromImage(filePath);
    console.log('[PROCESSOR] OCR rawText length:', rawText.length);

    // 1) Send the text to DeepSeek
    const deepseekResult = await sendToDeepSeek(rawText);

    console.log('[PROCESSOR] Raw DeepSeek output:', deepseekResult);

    // 2) Remove any code fences if the model still includes them
    const cleaned = stripCodeBlocks(deepseekResult);

    // 3) Try to parse JSON
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
