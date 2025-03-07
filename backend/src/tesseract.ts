import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Optimizes the image for OCR.
 * - Upscales the image if its width is below 1024 pixels.
 * - Resizes the image to a maximum width of 1024 (without enlarging if already larger).
 * - Applies grayscale conversion, normalization, sharpening, and mild brightness/saturation adjustments.
 * - Optionally applies a light dilation-like step to thicken thin characters.
 *
 * @param input - A Buffer of the image.
 * @param enableDilation - Whether to apply the dilation step (default: false).
 * @returns A Promise resolving to a Buffer containing the optimized image.
 */
async function optimizeImage(input: Buffer, enableDilation: boolean = false): Promise<Buffer> {
  let image = sharp(input);
  const metadata = await image.metadata();
  
  // Upscale if image is too small; otherwise, resize without enlarging.
  if (metadata.width && metadata.width < 1024) {
    image = image.resize({ width: 1024 });
  } else {
    image = image.resize({ width: 1024, withoutEnlargement: true });
  }

  image = image
    .grayscale()
    .normalize()
    .sharpen()
    .modulate({ brightness: 1.05, saturation: 1.05 });
  
  if (enableDilation) {
    image = image
      .negate()
      .convolve({
        width: 3,
        height: 3,
        kernel: [
          0, 1, 0,
          1, 1, 1,
          0, 1, 0
        ],
      })
      .threshold(220)
      .negate();
  }

  return image.toBuffer();
}

/**
 * Extracts text from an image using Tesseract OCR.
 * The image is first optimized for improved OCR accuracy.
 * Tesseract is configured to recognize both English and Indonesian.
 *
 * @param fileBuffer - A Buffer of the image.
 * @returns A Promise resolving to an object with a "rawText" property containing the OCR result.
 */
export async function extractTextFromImage(fileBuffer: Buffer): Promise<{ rawText: string }> {
  const optimizedBuffer = await optimizeImage(fileBuffer, false);
  const { data: { text } } = await Tesseract.recognize(optimizedBuffer, 'eng+ind', {
    logger: m => console.log('Tesseract log:', m)
  });
  return { rawText: text };
}
