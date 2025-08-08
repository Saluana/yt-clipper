<!-- artifact_id: 8c2f5e22-9f11-4d66-9a08-7d4b6a7d5a7f -->

# Queue Layer — Requirements (pg-boss)

## Introduction

Provide a durable, at-least-once job queue using Postgres via pg-boss. Support priorities, retries with backoff, visibility timeouts, and dead-letter handling. Expose a thin abstraction so we can swap implementations later if needed.

---

## Functional Requirements

1. Publish Jobs

-   User Story: As the API, I want to enqueue a job with metadata, so that workers can process it asynchronously.
-   Acceptance:
    -   WHEN a job is published, THEN it SHALL be persisted in Postgres and available for workers.
    -   WHEN publishing, THEN priority and timeout SHALL be configurable per job.

2. Consume & Process

-   User Story: As a worker, I want to claim jobs and process them with a visibility timeout, so that stuck jobs are retried.
-   Acceptance:
    -   WHEN a worker claims a job, THEN it SHALL be invisible to other workers until ack/timeout.
    -   WHEN processing completes, THEN the job SHALL be acked; on failure, retries SHALL apply.

3. Retries & Backoff

-   User Story: As an operator, I want controlled retries, so that transient errors recover without overload.
-   Acceptance:
    -   WHEN a job fails, THEN it SHALL retry up to MAX attempts with exponential backoff and jitter.
    -   WHEN retries are exhausted, THEN the job SHALL be sent to a dead-letter queue/topic.

4. Priorities

-   User Story: As a scheduler, I want job priorities, so that urgent tasks run first.
-   Acceptance:
    -   WHEN a job has priority `fast|normal|bulk`, THEN the system SHALL schedule higher-priority jobs sooner.

5. Idempotency

-   User Story: As a worker, I want to avoid duplicate processing, so that at-least-once delivery doesn’t create double work.
-   Acceptance:
    -   WHEN a job is re-delivered, THEN the worker SHALL short-circuit if it’s already completed in DB/Storage.

6. Observability

-   User Story: As an operator, I want metrics and logs, so that I can see queue depth, lag, and failures.
-   Acceptance:
    -   WHEN the system runs, THEN it SHALL emit metrics for queue depth, claim latency, success/fail counts, and retry counts.

7. Configuration

-   User Story: As a maintainer, I want runtime tuning via env, so that I can adjust without code changes.
-   Acceptance:
    -   WHEN env vars change, THEN visibility timeout, retries, and concurrency SHALL adjust accordingly on restart.

---

## Non-Functional Requirements

-   No DB extensions required beyond what Supabase provides by default.
-   Safe shutdown and graceful worker drain.
-   Bun compatibility (via node-postgres). If any edge arises, a small Node process is acceptable as a fallback.

---

## Out of Scope

-   Data model persistence (handled by Data Layer).
-   Media/ASR steps (Worker/Media layers).
