import { removeBackground } from '@imgly/background-removal';

/**
 * Removes the background from an image source (URL or Blob)
 * and returns the processed image as a Blob.
 */
export async function processBackgroundRemoval(imageSource: string | Blob): Promise<Blob> {
    try {
        const result = await removeBackground(imageSource, {
            model: 'isnet_quint8',
            progress: (_key, _current, _total) => {
                // Optional: track progress if needed
                // console.log(`Background removal progress: ${_key} ${_current}/${_total}`);
            },
            // Use library's default CDN (staticimgly.com) which hosts correct model files for v1.7.0
        });
        return result;
    } catch (error) {
        console.error('Error during background removal:', error);
        throw error;
    }
}

/**
 * Converts a Blob to a base64 string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
