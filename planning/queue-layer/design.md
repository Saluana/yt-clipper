<!-- artifact_id: 5a5c1e9b-3f5f-4bf1-9a3c-1c1f1e9df0a3 -->

# Queue Layer — Design (pg-boss)

## Overview

Use pg-boss to implement an at-least-once queue backed by Supabase Postgres. Keep a thin adapter with stable interfaces so we can swap providers.

---

## Architecture

```mermaid
flowchart LR
  API -->|publish(job)| Queue[Queue Adapter]
  Queue -->|enqueue| PGBoss[(pg-boss on Postgres)]
  Worker -->|consume| Queue
  Queue -->|ack/retry/dlq| PGBoss
```

---

## Topics & Priority

Option A (single topic + priority):

-   Topic: `clips`
-   Priority mapping: fast=10, normal=50, bulk=90 (lower number = higher priority)

Option B (multiple topics):

-   Topics: `clips.fast`, `clips.normal`, `clips.bulk`

Recommendation: Start with single topic + priority for simplicity; add separate topics later if needed.

---

## Visibility, Retries, DLQ

-   Visibility/timeout: `QUEUE_VISIBILITY_SEC` (e.g., 90s). Configure via job `timeout`.
-   Retries: `QUEUE_MAX_ATTEMPTS` (default 3) with exponential backoff (base `QUEUE_RETRY_BACKOFF_MS_BASE`, max `QUEUE_RETRY_BACKOFF_MS_MAX`) and jitter.
-   Dead-letter: publish exhausted jobs to `clips.dlq` with original payload + error.

---

## Interfaces

```ts
export interface QueueMessage {
    jobId: string;
    priority?: 'fast' | 'normal' | 'bulk';
}

export interface QueueAdapter {
    publish(msg: QueueMessage, opts?: { timeoutSec?: number }): Promise<void>;
    consume(handler: (msg: QueueMessage) => Promise<void>): Promise<void>;
    shutdown(): Promise<void>;
}
```

pg-boss wiring (sketch):

```ts
import PgBoss from 'pg-boss';

const boss = new PgBoss({
    connectionString: process.env.DATABASE_URL!,
    schema: process.env.PG_BOSS_SCHEMA || 'pgboss',
    // tuneable intervals
});

await boss.start();

await boss.subscribe(
    'clips',
    {
        teamSize: Number(process.env.QUEUE_CONCURRENCY || 4),
        includeMetadata: true,
    },
    async (job) => {
        try {
            await handler(job.data as QueueMessage);
            await boss.complete(job.id);
        } catch (err) {
            // let pg-boss handle retries per job options
            throw err;
        }
    }
);

export async function publishClip(msg: QueueMessage) {
    const priorityMap = { fast: 10, normal: 50, bulk: 90 } as const;
    await boss.publish('clips', msg, {
        priority: priorityMap[msg.priority ?? 'normal'],
        timeout: Number(process.env.QUEUE_VISIBILITY_SEC || 90) * 1000,
        retryLimit: Number(process.env.QUEUE_MAX_ATTEMPTS || 3),
        retryBackoff: true,
    });
}
```

Notes:

-   pg-boss manages retries/timeout internally; throwing from the handler triggers retry/backoff.
-   Include job metadata for tracing and metrics.

---

## Observability

-   Emit metrics: published, claimed, completed, failed, retried; job durations.
-   Log with jobId and topic; redact payload secrets.
-   Health: boss.on('error') handler + a `/healthz` that checks connection and queue lag (optional query on boss state).

---

## Shutdown

-   Trap SIGINT/SIGTERM; stop consuming; wait for in-flight jobs; call `boss.stop()`.
