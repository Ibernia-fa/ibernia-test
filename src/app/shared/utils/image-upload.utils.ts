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
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Compress image: max dimension 1200px, JPEG quality 0.85 */
export function compressImage(dataUrl: string, maxDimension = 1200, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w <= maxDimension && h <= maxDimension) {
        resolve(dataUrl);
        return;
      }
      const scale = maxDimension / Math.max(w, h);
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
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}
