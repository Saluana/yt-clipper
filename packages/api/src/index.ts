import { Elysia, t } from 'elysia';
import cors from '@elysiajs/cors';
import { Schemas, CreateJobInputType } from '@clipper/contracts';
import { createLogger } from '@clipper/common';
import { InMemoryJobsRepo, InMemoryJobEventsRepo } from '@clipper/data';
import { PgBossQueueAdapter } from '@clipper/queue';

const log = createLogger((process.env.LOG_LEVEL as any) || 'info').with({
    mod: 'api',
});

const jobsRepo = new InMemoryJobsRepo();
const eventsRepo = new InMemoryJobEventsRepo();
const queue = new PgBossQueueAdapter({
    connectionString: process.env.DATABASE_URL!,
});
await queue.start();

function tcToSec(tc: string) {
    const [hh, mm, rest] = tc.split(':');
    const [ss, ms] = rest?.split('.') || [rest || '0', undefined];
    return (
        Number(hh) * 3600 +
        Number(mm) * 60 +
        Number(ss) +
        (ms ? Number(`0.${ms}`) : 0)
    );
}

export const app = new Elysia()
    .use(cors())
    .get('/healthz', async () => {
        const h = await queue.health();
        return { ok: h.ok, queue: h };
    })
    .get('/metrics/queue', () => queue.getMetrics())
    .post('/api/jobs', async ({ body, set }) => {
        const parsed = Schemas.CreateJobInput.safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return {
                error: {
                    code: 'VALIDATION_FAILED',
                    message: parsed.error.message,
                },
            };
        }
        const input = parsed.data as CreateJobInputType;
        const id = crypto.randomUUID();
        const startSec = tcToSec(input.start);
        const endSec = tcToSec(input.end);
        if (endSec - startSec > Number(process.env.MAX_CLIP_SECONDS || 120)) {
            set.status = 400;
            return {
                error: {
                    code: 'CLIP_TOO_LONG',
                    message: 'Clip exceeds MAX_CLIP_SECONDS',
                },
            };
        }
        const row = await jobsRepo.create({
            id,
            status: 'queued',
            progress: 0,
            sourceType: input.sourceType,
            sourceKey: input.uploadKey,
            sourceUrl: input.youtubeUrl,
            startSec,
            endSec,
            withSubtitles: input.withSubtitles,
            burnSubtitles: input.burnSubtitles,
            subtitleLang: input.subtitleLang,
            resultVideoKey: undefined,
            resultSrtKey: undefined,
            errorCode: undefined,
            errorMessage: undefined,
            expiresAt: undefined,
        });

        await eventsRepo.add({
            jobId: id,
            ts: new Date().toISOString(),
            type: 'created',
        });
        await queue.publish({ jobId: id, priority: 'normal' });

        return {
            id: row.id,
            status: row.status,
            expiresAt: new Date(
                Date.now() +
                    Number(process.env.RETENTION_HOURS || 72) * 3600_000
            ).toISOString(),
        };
    });

if (import.meta.main) {
    const port = Number(process.env.PORT || 3000);
    const server = Bun.serve({ fetch: app.fetch, port });
    log.info('API started', { port });
    const stop = async () => {
        log.info('API stopping');
        server.stop(true);
        await queue.shutdown();
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
}
