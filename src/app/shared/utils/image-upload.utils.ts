/** Allowed image types for profile, company logo, and background */
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
export const ALLOWED_ACCEPT = '.png,.jpg,.jpeg';

/** Allowed file extensions (case-insensitive) - JFIF (.jfif) explicitly excluded */
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

/** Max file size: 5MB */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Background minimum dimensions (flexible: 800×400) */
export const BACKGROUND_MIN_WIDTH = 800;
export const BACKGROUND_MIN_HEIGHT = 400;

export function isAllowedFileType(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const ext = name.includes('.') ? '.' + name.split('.').pop()! : '';
  // Reject JFIF (.jfif) and other non-allowed extensions even if MIME is image/jpeg
  if (!ALLOWED_EXTENSIONS.includes(ext)) return false;
  return ALLOWED_IMAGE_TYPES.some(t => type === t || type === 'image/jpg');
}

export function isWithinSizeLimit(file: File): boolean {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('Invalid file content'));
    };
    reader.readAsDataURL(file);
  });
}

/** Convert a data URL to a Blob for multipart upload (e.g. POST /api/v1/organizations/logo). */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) {
    throw new Error('Invalid data URL');
  }
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeMatch = /^data:([^;]+)/.exec(header);
  const mime = mimeMatch?.[1]?.trim() || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

/** Get image dimensions from data URL */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Resize image to meet minimum dimensions (upscale if needed) */
export function resizeImageToMin(
  dataUrl: string,
  minWidth: number,
  minHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w >= minWidth && h >= minHeight) {
        resolve(dataUrl);
        return;
      }
      const scale = Math.max(minWidth / w, minHeight / h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Max base64 size for profile/logo payloads to avoid 413 from reverse proxies.
 * ~800KB base64 ≈ 600KB raw; keeps total JSON under typical 1MB proxy limits.
 */
export const MAX_BASE64_PAYLOAD_BYTES = 800 * 1024;

/**
 * Compress image: max dimension 1200px, JPEG quality 0.85. Always outputs JPEG to avoid large PNG payloads.
 * @param skipEncodeWhenWithinMax If true and both sides are already ≤ maxDimension, return the original data URL (no canvas re-encode).
 */
export function compressImage(
  dataUrl: string,
  maxDimension = 1200,
  quality = 0.85,
  skipEncodeWhenWithinMax = false,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (skipEncodeWhenWithinMax && w <= maxDimension && h <= maxDimension) {
        resolve(dataUrl);
        return;
      }
      const scale = w <= maxDimension && h <= maxDimension ? 1 : maxDimension / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Full-width backgrounds need more pixels than logos; file upload is already capped at 5MB. */
const BACKGROUND_MAX_DIMENSION = 2560;
const BACKGROUND_JPEG_QUALITY = 0.92;

/** Resize if oversized, else keep original encoding to avoid double JPEG loss. */
export function compressForBackground(dataUrl: string): Promise<string> {
  return compressImage(dataUrl, BACKGROUND_MAX_DIMENSION, BACKGROUND_JPEG_QUALITY, true);
}

/**
 * Shrink background data URL if it is still huge after preview compression (detailed photos at 2560px
 * can exceed ~2–3MB base64). Call before POST /api/v1/organizations/background so strict proxies/CDNs are less
 * likely to return 413. Does nothing if already under the cap.
 */
const MAX_BACKGROUND_DATA_URL_CHARS = 3_000_000;

export async function ensureBackgroundDataUrlWithinLimit(dataUrl: string): Promise<string> {
  if (!dataUrl || dataUrl.length <= MAX_BACKGROUND_DATA_URL_CHARS) return dataUrl;
  let step = await compressImage(dataUrl, 1920, 0.82, false);
  if (step.length <= MAX_BACKGROUND_DATA_URL_CHARS) return step;
  step = await compressImage(dataUrl, 1600, 0.76, false);
  if (step.length <= MAX_BACKGROUND_DATA_URL_CHARS) return step;
  step = await compressImage(dataUrl, 1280, 0.72, false);
  if (step.length <= MAX_BACKGROUND_DATA_URL_CHARS) return step;
  return compressImage(dataUrl, 1200, 0.68, false);
}

/** Compress profile/logo image to stay under proxy body limits. Uses smaller dimensions and enforces max size. */
export async function compressForProfilePayload(dataUrl: string): Promise<string> {
  let result = await compressImage(dataUrl, 600, 0.8);
  if (result.length <= MAX_BASE64_PAYLOAD_BYTES) return result;
  result = await compressImage(dataUrl, 400, 0.7);
  if (result.length <= MAX_BASE64_PAYLOAD_BYTES) return result;
  return compressImage(dataUrl, 300, 0.6);
}
