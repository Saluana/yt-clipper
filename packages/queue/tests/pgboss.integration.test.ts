import { describe, test, it, expect, beforeAll, afterAll } from 'vitest';
import { PgBossQueueAdapter } from '@clipper/queue';

const DATABASE_URL = process.env.DATABASE_URL;

describe('PgBossQueueAdapter integration', () => {
    if (!DATABASE_URL) {
        it.skip('DATABASE_URL not set; skipping integration test', () => {});
        return;
    }

    const queue = new PgBossQueueAdapter({ connectionString: DATABASE_URL });

    beforeAll(async () => {
        await queue.start();
    });

    afterAll(async () => {
        await queue.shutdown();
    });

    test('publish -> consume once with health and metrics', async () => {
        const seen: string[] = [];
        const id = crypto.randomUUID();

        const done = new Promise<void>(async (resolve, reject) => {
            try {
                await queue.consume(async ({ jobId }) => {
                    if (jobId === id) {
                        seen.push(jobId);
                        resolve();
                    }
                });
            } catch (e) {
                reject(e);
            }
        });

        await queue.publish({ jobId: id, priority: 'normal' });

        // Wait up to 5s for consume
        await Promise.race([
            done,
            new Promise((_r, reject) =>
                setTimeout(() => reject(new Error('timeout')), 5000)
            ),
        ]);

        expect(seen).toContain(id);

        const health = await queue.health();
        expect(health.ok).toBe(true);

        const m = queue.getMetrics();
        expect(m.publishes).toBeGreaterThan(0);
        expect(m.claims).toBeGreaterThan(0);
        expect(m.completes).toBeGreaterThan(0);
    });
});
