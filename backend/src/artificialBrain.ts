// backend/src/artificialBrain.ts
import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
});

export async function sendToDeepSeek(ocrText: string): Promise<string> {
  console.log('[DEEPSEEK] Preparing chat messages for model: deepseek-chat');

  const systemMessage = {
    role: 'system' as const,
    content: 'You are a helpful invoice extraction assistant.',
  };

  // **IMPORTANT**: Add a directive that no extra text or code blocks be returned.
  const userPrompt = `
Below is the OCR text of an invoice. Return only JSON (no code blocks or extra text) with the following fields:

- Nama penjual/perusahaan
- Nama pembeli
- Alamat pembeli
- Nomor telefon pembeli
- Email pembeli
- Nomor faktur
- Tanggal faktur (dd/mm/yyyy only)
- Tanggal jatuh tempo faktur (dd/mm/yyyy only)
- Rincian pajak (PPN or VAt or Sales Tax or similar terms) as a percentage only (e.g., "10%")
- Total jumlah pembayaran

If a field is missing, set it to null. Do not add disclaimers or additional commentary. 

For both "Tanggal faktur" and "Tanggal jatuh tempo faktur," output them strictly in dd/mm/yyyy format (e.g., 01/02/2025).

OCR TEXT:
${ocrText}
`;

  const userMessage = {
    role: 'user' as const,
    content: userPrompt,
  };

  console.log('[DEEPSEEK] Sending chat.completions.create request...');
  const completion = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [systemMessage, userMessage],
  });

  // content might be string | null
  const text: string = completion.choices[0].message.content ?? '';

  console.log('[DEEPSEEK] Received response length:', text.length);
  return text;
}
