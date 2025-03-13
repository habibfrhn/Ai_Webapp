// pdfConverter.ts
import { fromPath } from "pdf2pic";
import fs from "fs";
import path from "path";
import os from "os";

// Use optimum dimensions (as defined in imageOptimizer.ts)
const OPTIMAL_WIDTH = 1024;
const OPTIMAL_HEIGHT = 1024;

export async function convertPDFToImages(pdfPath: string): Promise<Buffer[]> {
  const options = {
    density: 100,
    saveFilename: "invoice",
    savePath: path.join(os.tmpdir(), "pdf2pic"), // temporary folder
    format: "jpeg",
    width: OPTIMAL_WIDTH,
    height: OPTIMAL_HEIGHT,
  };

  // Ensure the temporary directory exists
  if (!fs.existsSync(options.savePath)) {
    fs.mkdirSync(options.savePath, { recursive: true });
  }

  const converter = fromPath(pdfPath, options);
  try {
    // Convert all pages (using -1 to indicate all pages)
    const conversionResults = await converter.bulk(-1, { responseType: "buffer" });
    console.log("PDF conversion results:", conversionResults);
    // Map conversion results to an array of Buffers.
    const buffers: Buffer[] = conversionResults.map(result => {
      if (result && (result as any).buffer) {
        return (result as any).buffer;
      }
      throw new Error("PDF conversion result is missing the buffer property");
    });
    return buffers;
  } catch (error) {
    console.error("Error in PDF conversion:", error);
    throw error;
  }
}
