import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@tanstack/react-query-devtools', 'react-dom/client'],
  },
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          provider: playwright(),
          browser: 'chromium',
          name: 'chrome',
          headless: true,
        },
      ],
    },
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
