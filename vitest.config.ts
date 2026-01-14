import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
      
      pool: 'forks',
      poolOptions: {
        forks: {
          singleFork: true,
        },
      },
      
      testTimeout: 15000,
      hookTimeout: 15000,
      
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'tests/',
          '**/*.config.ts',
          '**/*.config.js',
          'src/test-setup.ts',
        ],
      },
    },
  })
);