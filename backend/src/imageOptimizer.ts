// imageOptimizer.ts

import sharp from 'sharp';

// Define optimal dimensions for width and height.
// You can tweak these values based on your application's requirements.
const OPTIMAL_WIDTH = 1024;  // optimum width in pixels
const OPTIMAL_HEIGHT = 1024; // optimum height in pixels

// JPEG quality for compression (adjust as necessary to balance quality and size)
const JPEG_QUALITY = 80;

/**
 * Optimizes an image by resizing it to the optimum dimensions.
 * - If the image is too small, it will be upscaled.
 * - If the image is too large, it will be downscaled.
 * The aspect ratio is preserved, and the output is a light-sized JPEG.
 * All processing is done in memory.
 *
 * @param imageBuffer Buffer containing the original image data.
 * @returns Promise resolving to a Buffer containing the optimized image.
 */
export async function optimizeImage(imageBuffer: Buffer): Promise<Buffer> {
  return await sharp(imageBuffer)
    .resize(OPTIMAL_WIDTH, OPTIMAL_HEIGHT, {
      fit: 'inside',          // Ensure the image fits within the optimal dimensions
      withoutEnlargement: false // Allow upscaling if the image is smaller than optimal
    })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
