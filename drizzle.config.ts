import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/data/src/db/schema.ts',
  out: './packages/data/drizzle',
  dialect: 'postgresql',
  strict: true,
});
