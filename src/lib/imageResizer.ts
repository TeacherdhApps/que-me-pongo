/**
 * Resizes an image URL (base64 or blob URL) to a maximum dimension while maintaining aspect ratio
 * and returns it as a compressed JPEG base64 string.
 * This version uses improved white-background logic and handles async loading better for Android.
 */
export async function resizeImage(imageUrl: string, maxWidth = 1200, maxHeight = 1200, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width *= ratio;
            height *= ratio;

            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better JPEG performance
            if (!ctx) {
                reject(new Error('Canvas context failure'));
                return;
            }

            // High quality scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Forced white background (prevents black transparent squares)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                // toBlob is more stable on some Android browsers than toDataURL
                canvas.toBlob((blob) => {
                    if (!blob) {
                        // Fallback to DataURL if toBlob fails
                        resolve(canvas.toDataURL('image/jpeg', quality));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                }, 'image/jpeg', quality);
            } catch (e) {
                // Final fallback
                resolve(canvas.toDataURL('image/jpeg', quality));
            }
        };

        img.onerror = () => reject(new Error('Error al cargar la imagen original.'));
        img.src = imageUrl;
    });
}

/**
 * Generates a tiny base64 placeholder for progressive image loading.
 */
export async function generateThumbnail(base64Str: string): Promise<string> {
    return resizeImage(base64Str, 20, 20, 0.3);
}
