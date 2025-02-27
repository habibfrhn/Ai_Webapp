// tesseract.ts
import Tesseract from 'tesseract.js';
import sharp from 'sharp';

/**
 * Optimizes the image for OCR.
 * - Upscales the image if its width is below 1024 pixels.
 * - Resizes the image to a maximum width of 1024 (without enlarging if already larger).
 * - Applies grayscale conversion, normalization, sharpening, and mild brightness/saturation adjustments.
 * - Optionally applies a light dilation-like step to thicken thin characters.
 *
 * @param filePath - The path to the image file.
 * @param enableDilation - Whether to apply the dilation step (default: false).
 * @returns A Promise resolving to a Buffer containing the optimized image.
 */
async function optimizeImage(filePath: string, enableDilation: boolean = false): Promise<Buffer> {
  const image = sharp(filePath);
  const metadata = await image.metadata();
  let imageProcessor = image;

  // Upscale if image is too small; otherwise, resize without enlarging.
  if (metadata.width && metadata.width < 1024) {
    imageProcessor = imageProcessor.resize({ width: 1024 });
  } else {
    imageProcessor = imageProcessor.resize({ width: 1024, withoutEnlargement: true });
  }

  // Basic processing: grayscale, normalize, sharpen, and gentle adjustments.
  imageProcessor = imageProcessor
    .grayscale()
    .normalize()
    .sharpen()
    .modulate({ brightness: 1.05, saturation: 1.05 });
  
  // Optionally apply a light dilation-like step.
  if (enableDilation) {
    // This configuration uses a mild convolution kernel and a high threshold
    // to minimally thicken characters without overly distorting them.
    imageProcessor = imageProcessor
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
      .threshold(220) // High threshold to apply only slight thickening.
      .negate();
  }

  return imageProcessor.toBuffer();
}

/**
 * Extracts text from an image using Tesseract OCR.
 * The image is first optimized for improved OCR accuracy.
 * Tesseract is configured to recognize both English and Indonesian.
 *
 * @param filePath - The path to the image file.
 * @returns A Promise resolving to an object with a "rawText" property containing the OCR result.
 */
export async function extractTextFromImage(filePath: string): Promise<{ rawText: string }> {
  // Try with dilation disabled first. Enable it if you find thin characters are still an issue.
  const optimizedBuffer = await optimizeImage(filePath, false);

  const { data: { text } } = await Tesseract.recognize(optimizedBuffer, 'eng+ind', {
    logger: m => console.log('Tesseract log:', m)
  });

  return { rawText: text };
}
