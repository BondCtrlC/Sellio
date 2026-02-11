/**
 * Server-side QR code extraction from image buffer.
 * Uses sharp (image processing) + jsQR (QR decoder).
 *
 * SECURITY: QR codes must be extracted server-side, never trusted from client.
 * A malicious client could send a fake QR code string while uploading a
 * different image, bypassing payment verification.
 */
import sharp from 'sharp';
import jsQR from 'jsqr';

/**
 * Extract QR code text from an image buffer (JPEG, PNG, WebP).
 * Returns the decoded QR text, or null if no QR code found.
 *
 * Tries multiple strategies:
 * 1. Original size (up to 1500px)
 * 2. Upscaled 2x for small QR codes
 * 3. Grayscale + high contrast for low-quality images
 */
export async function extractQrFromImage(imageBuffer: Buffer | Uint8Array): Promise<string | null> {
  const buf = Buffer.from(imageBuffer);

  // Strategy 1: Normal extraction at reasonable size
  const result = await tryExtract(buf, { maxWidth: 1500 });
  if (result) return result;

  // Strategy 2: Upscale for small QR codes
  const result2 = await tryExtract(buf, { maxWidth: 2000, scale: 2 });
  if (result2) return result2;

  // Strategy 3: High contrast grayscale
  const result3 = await tryExtract(buf, { maxWidth: 1500, grayscale: true, sharpen: true });
  if (result3) return result3;

  return null;
}

interface ExtractOptions {
  maxWidth: number;
  scale?: number;
  grayscale?: boolean;
  sharpen?: boolean;
}

async function tryExtract(buf: Buffer, options: ExtractOptions): Promise<string | null> {
  try {
    let pipeline = sharp(buf);

    // Get metadata to calculate resize
    const metadata = await sharp(buf).metadata();
    if (!metadata.width || !metadata.height) return null;

    let targetWidth = Math.min(metadata.width, options.maxWidth);
    if (options.scale) {
      targetWidth = Math.min(metadata.width * options.scale, options.maxWidth);
    }

    pipeline = pipeline.resize(targetWidth, undefined, { fit: 'inside' });

    if (options.grayscale) {
      pipeline = pipeline.grayscale();
    }
    if (options.sharpen) {
      pipeline = pipeline.sharpen();
    }

    // Convert to raw RGBA pixel data for jsQR
    const { data, info } = await pipeline
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const qrResult = jsQR(
      new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
      info.width,
      info.height,
      { inversionAttempts: 'attemptBoth' },
    );

    if (qrResult && qrResult.data && qrResult.data.length > 0) {
      return qrResult.data;
    }

    return null;
  } catch {
    return null;
  }
}
