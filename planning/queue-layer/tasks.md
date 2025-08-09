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

-   [x] Metrics: publishes, claims, completes, retries, failures
-   [x] Error handling hooks: boss.on('error')
-   [x] Health endpoint checks boss connectivity

## 5. Testing

-   [ ] Unit test adapter (mock boss)
-   [x] Integration: minimal publish → consume happy path against local Postgres (skips if DATABASE_URL unset)
-   [ ] Integration: retry on throw → DLQ after limit

## 6. Ops

-   [x] Graceful shutdown on SIGINT/SIGTERM
-   [ ] Document minimal production settings and scaling notes

## 7. Post-DB Layer Integration (Drizzle + Postgres)

-   [ ] Replace in-memory repo with Drizzle repositories in `packages/data` (jobs, job_events, any metadata tables)
-   [ ] Define Drizzle schema for:
    -   [ ] jobs (id, status, priority, attempts, last_error, created_at, updated_at)
    -   [ ] job_events (job_id FK, type, payload/jsonb, created_at)
    -   [ ] dlq_jobs (job_id, reason, payload, created_at) or reuse job_events with type=dlq
    -   [ ] indexes: (status), (created_at), (job_id), (priority, status)
-   [ ] Create migrations for the above tables (do not commit secrets); verify `bunx drizzle-kit` workflow or existing migration tool
-   [ ] Ensure `pgboss` schema exists or allow pg-boss to manage its own schema via `maintenance`/migrate on start; document choice
-   [ ] Implement transactional publish:
    -   [ ] Insert job row
    -   [ ] Publish to queue
    -   [ ] Commit; on failure, roll back insert
-   [ ] Idempotency: unique constraint on job id; implement upsert/no-op on duplicate publishes
-   [ ] Worker consume path:
    -   [ ] Load job by id
    -   [ ] Guard against double-processing (status check + optimistic update)
    -   [ ] Update status/progress and append job_events
    -   [ ] Mark complete on success
-   [ ] Retry/DLQ path:
    -   [ ] On handler throw, increment attempts and rely on pg-boss retry
    -   [ ] After max attempts, persist DLQ record (dlq_jobs or job_events type=dlq) and publish to `clips.dlq`
-   [ ] Retention: scheduled cleanup for completed/failed/DLQ older than `RETENTION_HOURS`
-   [ ] Observability: expand metrics to include DB-backed counts; add lightweight health query for DB connectivity
-   [ ] Seed script updates to create sample jobs and events
-   [ ] E2E tests (real DB):
    -   [ ] publish → consume updates DB state and emits events
    -   [ ] retry then DLQ after limit persists DLQ record
    -   [ ] idempotent publish does not duplicate jobs
    -   [ ] retention cleanup removes old rows
-   [ ] CI: provide `DATABASE_URL` for tests (local docker-compose or external PG); skip integration tests if unset
-   [ ] Docs: update `@clipper/queue` README with schema diagram, transactions, DLQ flow, and ops notes
