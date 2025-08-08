import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: [
            'packages/**/tests/**/*.test.ts',
            'packages/**/tests/**/*.ts',
        ],
        environment: 'node',
        globals: false,
        watch: false,
    },
});
