import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/que-me-pongo/' : '/',
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['@imgly/background-removal']
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      external: [
        'onnxruntime-web',
        'onnxruntime-web/webgpu',
        'onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm'
      ]
    }
  },
})
