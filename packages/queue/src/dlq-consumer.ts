import PgBoss from 'pg-boss';
import { createLogger } from '@clipper/common';

const log = createLogger((process.env.LOG_LEVEL || 'info') as string).with({
    mod: 'queue-dlq',
});

export async function startDlqConsumer(opts?: {
    connectionString?: string;
    schema?: string;
    queueName?: string;
    concurrency?: number;
}) {
    const connectionString =
        opts?.connectionString || process.env.DATABASE_URL!;
    const schema = opts?.schema || process.env.PG_BOSS_SCHEMA || 'pgboss';
    const topic = (opts?.queueName ||
        process.env.QUEUE_NAME ||
        'clips') as string;
    const dlqTopic = `${topic}.dlq`;
    const concurrency = Number(
        opts?.concurrency || process.env.QUEUE_CONCURRENCY || 2
    );

    const boss = new PgBoss({ connectionString, schema });
    await boss.start();
    log.info('DLQ consumer started', { dlqTopic, concurrency });

    await boss.work(dlqTopic, { batchSize: concurrency }, async (jobs) => {
        for (const job of jobs) {
            const payload = job.data as Record<string, unknown>;
            log.error('DLQ message received', { jobId: job.id, payload });
            // TODO: integrate alerting (pager/email/webhook) here if desired
        }
    });

    return async () => {
        log.info('DLQ consumer stopping');
        await boss.stop();
    };
}
