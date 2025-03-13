// backend/ocrAgent.ts

// If you're using Node 18+, the global fetch is available. Otherwise, install node-fetch.
import fetch from 'node-fetch';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const HTTP_REFERER = process.env.SITE_URL || ''; // Optional: your site URL for rankings on openrouter.ai
const SITE_NAME = process.env.SITE_NAME || ''; // Optional: your site name for rankings on openrouter.ai
const MODEL = 'google/gemma-3-27b-it:free'; // Adjust the model if needed

export interface OCRAgentInput {
  text?: string;
  imageUrl?: string;
}

/**
 * Calls the OpenRouter API with the provided text and/or imageUrl input.
 * @param input Object containing optional text and imageUrl.
 * @returns The API response JSON.
 * @throws Error if the API key is missing or the request fails.
 */
export async function callOCRAgent(input: OCRAgentInput): Promise<any> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not set in environment variables.');
  }

  const messageContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

  if (input.text) {
    messageContent.push({
      type: 'text',
      text: input.text,
    });
  }

  if (input.imageUrl) {
    messageContent.push({
      type: 'image_url',
      image_url: {
        url: input.imageUrl,
      },
    });
  }

  if (messageContent.length === 0) {
    throw new Error('No input provided for OCRAgent: provide text and/or imageUrl.');
  }

  const payload = {
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: messageContent,
      },
    ],
  };

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  };

  // Optionally add site details if provided
  if (HTTP_REFERER) {
    headers['HTTP-Referer'] = HTTP_REFERER;
  }
  if (SITE_NAME) {
    headers['X-Title'] = SITE_NAME;
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API responded with ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(`Error calling OpenRouter API: ${error.message}`);
  }
}

export default callOCRAgent;
