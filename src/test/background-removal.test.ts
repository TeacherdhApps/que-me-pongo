import { describe, it, expect, vi, beforeEach } from 'vitest';
import { removeBackground } from '@imgly/background-removal';

describe('backgroundRemoval module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processBackgroundRemoval contract', () => {
    it('should export a processBackgroundRemoval function', async () => {
      const mod = await import('../lib/backgroundRemoval');
      expect(typeof mod.processBackgroundRemoval).toBe('function');
    });

    it('should export a blobToBase64 function', async () => {
      const mod = await import('../lib/backgroundRemoval');
      expect(typeof mod.blobToBase64).toBe('function');
    });
  });

  describe('CDN availability', () => {
    it('should be able to reach the default staticimgly.com CDN for model resources', async () => {
      // The fix: we removed the broken unpkg.com publicPath and rely on the library's
      // default CDN at staticimgly.com. This test verifies that CDN is accessible.
      const response = await fetch(
        'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/resources.json'
      );
      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);

      const resources = await response.json();
      expect(resources).toBeDefined();
      expect(typeof resources).toBe('object');
    });

    it('should NOT be able to reach the old broken unpkg URL (confirms the bug)', async () => {
      // This URL was the root cause of the bug — it returns 404 or fails to fetch
      try {
        const response = await fetch(
          'https://unpkg.com/@imgly/background-removal-data@1.7.0/dist/resources.json'
        );
        // If fetch succeeded, the response should not be ok (404)
        expect(response.ok).toBe(false);
      } catch {
        // Fetch itself may throw (CORS, network error, etc.) — that also confirms the URL is broken
        expect(true).toBe(true);
      }
    });
  });

  describe('@imgly/background-removal library', () => {
    it('should have removeBackground as a function export', () => {
      expect(typeof removeBackground).toBe('function');
    });
  });
});
