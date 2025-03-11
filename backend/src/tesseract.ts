import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Optimizes the image for OCR with a balanced preprocessing approach.
 * - Resizes the image so that neither width nor height exceeds 1024 pixels.
 *   Upscales smaller images to approach the target dimensions while preserving aspect ratio.
 * - Applies normalization to enhance contrast and brightness.
 * - Applies a slight sharpening filter to emphasize text edges.
 * - Converts the image to grayscale.
 *
 * @param input - A Buffer of the image.
 * @returns A Promise resolving to a Buffer containing the optimized image.
 */
async function optimizeImage(input: Buffer): Promise<Buffer> {
  let image = sharp(input);
  const metadata = await image.metadata();

  if (metadata.width && metadata.height) {
    console.log(`Original image size: ${metadata.width}x${metadata.height}`);
    const maxDimension = 1024;
    image = image.resize({
      width: maxDimension,
      height: maxDimension,
      fit: 'inside',
      // Removing "withoutEnlargement" allows for upscaling if the image is too small.
    });

    // Retrieve metadata after resizing to log new dimensions.
    const resizedMetadata = await image.metadata();
    console.log(`Resized image size: ${resizedMetadata.width}x${resizedMetadata.height}`);
  } else {
    console.warn('Could not retrieve original image dimensions.');
  }

  // Soft preprocessing improvements:
  // 1. Normalize: Enhances contrast and brightness.
  // 2. Sharpen: Accentuates edges to make text more defined.
  // 3. Grayscale: Reduces color complexity for OCR.
  image = image
    .normalize()
    .sharpen()
    .grayscale();

  return image.toBuffer();
}

/**
 * Extracts text from an image using Tesseract OCR.
 * The image is first optimized with a balanced preprocessing pipeline.
 * Tesseract is configured to recognize both English and Indonesian.
 *
 * @param fileBuffer - A Buffer of the image.
 * @returns A Promise resolving to an object with a "rawText" property containing the OCR result.
 */
export async function extractTextFromImage(fileBuffer: Buffer): Promise<{ rawText: string }> {
  try {
    const optimizedBuffer = await optimizeImage(fileBuffer);
    const { data: { text } } = await Tesseract.recognize(optimizedBuffer, 'eng+ind', {
      logger: m => console.log('Tesseract log:', m)
    });
    return { rawText: text };
  } catch (error) {
    console.error('Error during text extraction:', error);
    throw error;
  }
}
