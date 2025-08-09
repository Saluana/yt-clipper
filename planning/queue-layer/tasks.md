<!-- artifact_id: 0d40a0a9-b2e4-43f2-8f9d-bb47a7f86ae0 -->

# Queue Layer — Tasks (pg-boss)

## 1. Dependencies & config

-   [x] Add dependency: pg-boss
-   [x] Env: `QUEUE_PROVIDER=pgboss`, `PG_BOSS_SCHEMA=pgboss`, `QUEUE_NAME=clips`, `QUEUE_VISIBILITY_SEC=90`, `QUEUE_MAX_ATTEMPTS=3`, `QUEUE_RETRY_BACKOFF_MS_BASE=1000`, `QUEUE_RETRY_BACKOFF_MS_MAX=60000`, `QUEUE_CONCURRENCY=4`

## 2. Abstraction & adapter

-   [x] Define `QueueAdapter` interface
-   [x] Implement `PgBossQueueAdapter` with `publish`, `consume`, `shutdown`
-   [x] Map priorities fast|normal|bulk to numeric priority
-   [x] Support DLQ publish to `clips.dlq` after retries exhausted

## 2b. DLQ Consumer & Docs

-   [x] Add `startDlqConsumer()` to consume `clips.dlq` and log/alert
-   [x] Add README to `@clipper/queue` with usage and envs

## 3. Integration with Data Layer

-   [x] On `POST /api/jobs`, persist job row then `publish({ jobId, priority })` (temporary in-memory repo)
-   [x] Worker `consume` handler: load job from DB (in-memory now), check idempotency, process, update status, ack (by returning)
-   [x] Emit progress events to `job_events` (in-memory now)

## 4. Health & observability

-   [ ] Metrics: publishes, claims, completes, retries, failures
-   [ ] Error handling hooks: boss.on('error')
-   [ ] Health endpoint checks boss connectivity

## 5. Testing

-   [ ] Unit test adapter (mock boss)
-   [ ] Integration: start boss against local Postgres; publish → consume → retry on throw → DLQ after limit

## 6. Ops

-   [ ] Graceful shutdown on SIGINT/SIGTERM
-   [ ] Document minimal production settings and scaling notes
