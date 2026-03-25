
/**
 * Resizes an image URL (base64 or blob URL) to a maximum dimension while maintaining aspect ratio
 * and returns it as a compressed JPEG base64 string.
 */
export async function resizeImage(imageUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.6): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Fill canvas with white background before drawing
            // This prevents transparent PNGs from rendering as black squares
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);
            // Convert to JPEG with quality compression
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
        };
        img.onerror = (err) => reject(new Error('Image failed to load: ' + err));
        img.src = imageUrl;
    });
}

/**
 * Generates a tiny base64 placeholder for progressive image loading.
 */
export async function generateThumbnail(base64Str: string): Promise<string> {
    return resizeImage(base64Str, 20, 20, 0.3);
}
