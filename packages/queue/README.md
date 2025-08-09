# @clipper/queue

Queue abstraction and pg-boss adapter for yt-clipper.

## Usage

```ts
import { PgBossQueueAdapter, startDlqConsumer } from '@clipper/queue';

const queue = new PgBossQueueAdapter({
    connectionString: process.env.DATABASE_URL!,
});
await queue.start();
await queue.publish({ jobId: '123', priority: 'normal' });
await queue.consume(async ({ jobId }) => {
    // process job
});

// DLQ consumer
const stop = await startDlqConsumer();
// call await stop() on shutdown
```

## Env

-   DATABASE_URL
-   PG_BOSS_SCHEMA (default pgboss)
-   QUEUE_NAME (default clips)
-   QUEUE_VISIBILITY_SEC (default 90)
-   QUEUE_MAX_ATTEMPTS (default 3)
-   QUEUE_CONCURRENCY (default 4)

## Notes

-   Bun auto-loads .env; no dotenv required.
-   Throw in a consumer to trigger retry; successful completion returns normally.
-   DLQ messages are logged with level=error; integrate alerting in dlq-consumer.ts.
