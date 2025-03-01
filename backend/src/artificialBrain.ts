import 'dotenv/config';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL as string,
  apiKey: process.env.DEEPSEEK_API_KEY as string,
});

/**
 * callDeepSeek is a generic function that accepts a prompt and sends it
 * to DeepSeek, returning the model's response.
 *
 * @param prompt - The complete prompt (user message) to send.
 * @param systemInstruction - Optional system message to set context.
 * @returns The text response from DeepSeek.
 */
export async function callDeepSeek(
  prompt: string,
  systemInstruction = 'You are a helpful invoice extraction assistant.'
): Promise<string> {
  console.log('[DEEPSEEK] Preparing chat messages with provided prompt');

  const systemMessage = {
    role: 'system' as const,
    content: systemInstruction,
  };

  const userMessage = {
    role: 'user' as const,
    content: prompt,
  };

  console.log('[DEEPSEEK] Sending chat.completions.create request...');
  const completion = await openai.chat.completions.create({
    model: 'deepseek-reasoner',
    messages: [systemMessage, userMessage],
  });

  const text: string = completion.choices[0].message.content ?? '';
  console.log('[DEEPSEEK] Received response length:', text.length);
  return text;
}
