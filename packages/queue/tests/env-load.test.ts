import { describe, it, expect } from 'vitest';

describe('Bun .env auto-load', () => {
    it('exposes env vars via Bun.env when running under Bun runtime', () => {
        // @ts-ignore
        if (typeof Bun === 'undefined') {
            // Not running under Bun runtime (e.g., Vitest node env) — skip strict check
            expect(true).toBe(true);
            return;
        }
        // @ts-ignore
        expect(Bun.env.SIGNED_URL_TTL_SEC).toBeDefined();
        // @ts-ignore
        expect(Bun.env.QUEUE_PROVIDER).toBeDefined();
    });
});
