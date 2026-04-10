import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { configDefaults, coverageConfigDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setupTests.ts',
    exclude: [
      ...configDefaults.exclude,
      'e2e/**',
    ],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/test/**',
        'src/mocks/**',
      ],
    },
  },
})
