<!-- artifact_id: 2b6c8b68-9f56-4c5b-9e5a-1b7c3a1d297e -->

# Data Layer — Requirements (Supabase + Drizzle)

## Introduction

Define the persistent data model and storage contracts for the YouTube/File clipper. Provide durable job state, append-only observability, optional API key management, and storage buckets for sources and results. The layer must be simple to adopt locally, scale in production, and expose clear TypeScript types via Drizzle.

---

## Functional Requirements

### 1. Job Persistence

-   User Story: As an API, I want to create a job row when a request is received, so that workers can process it asynchronously.
-   Acceptance Criteria:
    -   WHEN a valid job is created, THEN the system SHALL insert into `jobs` with status=`queued`, timestamps, and an optional `expires_at`.
    -   WHEN a worker claims a job, THEN the system SHALL update status to `processing`, increment `attempts` when appropriate, and record `last_heartbeat_at` periodically.
    -   WHEN processing finishes, THEN the system SHALL update status to `done|failed`, persist result keys or error fields, and set `expires_at`.

### 2. Job Events (Observability)

-   User Story: As an operator, I want an append-only event stream per job, so that I can trace progress and diagnose failures.
-   Acceptance Criteria:
    -   WHEN a state transition or progress update occurs, THEN the system SHALL insert into `job_events(job_id, ts, type, data)`.
    -   WHEN events are queried by `job_id`, THEN the system SHALL return them ordered by time with an index-supported plan.

### 3. Optional API Keys

-   User Story: As an admin, I want to manage API keys with scopes and rate limits, so that I can control access.
-   Acceptance Criteria:
    -   WHEN a key is created, THEN the system SHALL store a non-recoverable hash and metadata (owner, scopes, limits).
    -   WHEN a key is revoked, THEN the system SHALL prevent further use and record `revoked_at`.

### 4. Indices & Retention

-   User Story: As a DBA, I want efficient status and expiration queries, so that hot paths stay fast and data is cleaned automatically.
-   Acceptance Criteria:
    -   WHEN querying by `(status, created_at)`, THEN the system SHALL use a supporting index.
    -   WHEN selecting by `expires_at < now()`, THEN the system SHALL use a supporting index.
    -   WHEN cleanup runs, THEN the system SHALL delete expired rows and cascade-delete `job_events`.

### 5. Storage Buckets

-   User Story: As a worker, I want standard storage locations, so that uploads and results are predictable.
-   Acceptance Criteria:
    -   IF `sources` bucket is missing, THEN setup SHALL define it (private by default).
    -   IF `results` bucket is missing, THEN setup SHALL define it (private by default).
    -   WHEN results are requested, THEN the system SHALL issue signed URLs with short TTLs.

### 6. Type-safe Access (Drizzle)

-   User Story: As a developer, I want typed models and repositories, so that I can avoid runtime shape errors.
-   Acceptance Criteria:
    -   WHEN building the project, THEN Drizzle types SHALL match the schema.
    -   WHEN using repositories, THEN CRUD operations SHALL be typed and unit-tested.

### 7. Migrations & Seeds

-   User Story: As a maintainer, I want idempotent migrations and minimal seed data, so that devs can bootstrap quickly.
-   Acceptance Criteria:
    -   WHEN running migrations on a fresh DB, THEN all tables, types, and indexes SHALL be created with no errors.
    -   WHEN migrating a non-empty DB, THEN changes SHALL be forward-only and backward-safe where possible.

### 8. Error Handling & Consistency

-   User Story: As an engineer, I want consistent error envelopes from the data layer, so that callers can handle failures deterministically.
-   Acceptance Criteria:
    -   WHEN repository operations fail, THEN the layer SHALL return `{ ok: false, code, message }` without leaking secrets.
    -   WHEN transactions are needed (e.g., state transition + event), THEN the layer SHALL commit atomically or not at all.

### 9. Security & Compliance

-   User Story: As a security lead, I need secrets and PII protected, so that the system complies with best practices.
-   Acceptance Criteria:
    -   WHEN storing keys, THEN only hashes SHALL be stored (no raw tokens).
    -   WHEN signing URLs, THEN TTL SHALL be configurable and short by default.
    -   WHEN querying by user-provided input, THEN the layer SHALL use parameterized queries.

### 10. Performance & Scale

-   User Story: As a performance engineer, I want predictable query plans under load, so that SLOs are met.
-   Acceptance Criteria:
    -   WHEN listing recent jobs by status, THEN P95 query latency SHALL be low on realistic volumes (indexes in place).
    -   WHEN event volume is high, THEN inserts into `job_events` SHALL remain append-only and index-friendly.

---

## Non-Functional Requirements

-   Use Supabase Postgres for durability; Drizzle for schema/types/migrations.
-   Idempotent repository methods where safe (e.g., upsert on replays).
-   Support local development with a `.env`-driven DSN.
-   Document setup for buckets and DB migrations.
-   Prefer simple primitives first (no partitions initially); leave room for partitioning later.

---

## Out of Scope (for this layer)

-   Queue mechanics and worker orchestration (covered in Queue/Worker layers).
-   FFmpeg/ASR implementation details (covered in Media/ASR layers).
