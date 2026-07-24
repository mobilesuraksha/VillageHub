import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-storage.js';
import { storage } from '/js/firebase/firebase-config.js';

/**
 * Resizes an image file to fit within maxDimension and re-encodes it as
 * WebP for a much smaller upload than a raw phone-camera JPEG/PNG. Falls
 * back to JPEG if the browser can't encode WebP (older Safari).
 */
export function compressImage(file, { maxDimension = 1600, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const tryEncode = (mimeType) => new Promise((res) => {
        canvas.toBlob((blob) => res(blob), mimeType, quality);
      });

      tryEncode('image/webp').then((webpBlob) => {
        if (webpBlob) {
          resolve({ blob: webpBlob, extension: 'webp', contentType: 'image/webp' });
        } else {
          tryEncode('image/jpeg').then((jpegBlob) => {
            resolve({ blob: jpegBlob, extension: 'jpg', contentType: 'image/jpeg' });
          });
        }
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image file'));
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses + uploads an image file to `folder/uid/subId/filename.webp`
 * and returns its public download URL.
 */
export async function uploadImage(file, folder, uid, subId, onProgressLabel) {
  const { blob, extension, contentType } = await compressImage(file);
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const storageRef = ref(storage, `${folder}/${uid}/${subId}/${fileName}`);
  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

export async function uploadImages(files, folder, uid, subId) {
  const urls = [];
  for (const file of files) {
    // Sequential (not Promise.all) so upload progress stays easy to reason
    // about and we don't blast a slow rural connection with parallel uploads.
    // eslint-disable-next-line no-await-in-loop
    urls.push(await uploadImage(file, folder, uid, subId));
  }
  return urls;
}

export async function deleteImageByUrl(url) {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('[storage-service] Could not delete image (may already be gone):', err);
  }
}
