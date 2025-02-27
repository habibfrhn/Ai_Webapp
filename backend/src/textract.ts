// backend/src/textract.ts

import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import * as fs from 'fs';
import path from 'path';

const textractClient = new TextractClient({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
  },
});

/**
 * Extract text (and blocks) from an invoice image using AWS Textract.
 */
export async function extractTextFromImage(filePath: string): Promise<{
  rawText: string;
  blocks: any[];
}> {
  console.log('[TEXTRACT] Reading file from path:', filePath);
  const fileBuffer = fs.readFileSync(path.resolve(filePath));

  console.log('[TEXTRACT] Sending to AWS Textract with FeatureTypes: [FORMS, TABLES]');
  const command = new AnalyzeDocumentCommand({
    Document: { Bytes: fileBuffer },
    FeatureTypes: ['FORMS', 'TABLES'],
  });

  const response = await textractClient.send(command);

  const blocks = response.Blocks || [];
  let rawText = '';

  for (const block of blocks) {
    if (block.BlockType === 'LINE' && block.Text) {
      rawText += block.Text + '\n';
    }
  }

  console.log('[TEXTRACT] OCR extraction complete. Raw text length:', rawText.length);
  // Log the extracted text
  console.log('[TEXTRACT] OCR extracted text:\n', rawText);

  return {
    rawText,
    blocks,
  };
}
