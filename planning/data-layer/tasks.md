<!-- artifact_id: 4b3a2a7c-2a40-4b97-b386-0df39bdfd3d0 -->

# Data Layer — Tasks (Supabase + Drizzle)

## 1. Initialize schema and migrations

-   [x] Create Drizzle schema files for `jobs`, `job_events`, `api_keys` (optional)
    -   Requirements: 1, 2, 3
-   [x] Add indices: `idx_jobs_status_created_at`, `idx_jobs_expires_at`, `idx_job_events_job_id_ts`
    -   Requirements: 4
-   [x] Generate and commit Drizzle migrations
    -   Requirements: 7

## 2. Repository implementations

-   [x] Implement `JobsRepo` with `create`, `get`, `update`, `listByStatus`, `transition`
    -   Requirements: 1, 6, 8
-   [x] Implement `JobEventsRepo` with `add`, `list`
    -   Requirements: 2, 6
-   [x] Implement transactional state transitions (update + event)
    -   Requirements: 8

## 3. Storage helpers (Supabase Storage)

-   [x] Provide canonical key builders (`sources/{jobId}/source.ext`, `results/{jobId}/clip.*`)
    -   Requirements: 5
-   [x] Implement `StorageRepo` methods: `upload`, `sign`, `remove`
    -   Requirements: 5, 9
-   [x] Add configuration for signed URL TTL (default 10 minutes)
    -   Requirements: 9

## 4. Local development setup

-   [x] Add `.env` entries: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
    -   Requirements: Non-functional
-   [x] Provide a bootstrap script to create buckets `sources`, `results` if missing
    -   Requirements: 5, 7
-   [x] Document how to run migrations and seed minimal data
    -   Requirements: 7

## 5. Cleanup and retention

-   [x] Implement a cleanup job: delete expired `jobs` and cascade `job_events`; remove result objects
    -   Requirements: 4
-   [x] Add a dry-run and rate-limit option for deletes
    -   Requirements: 4, 9

## 6. Testing

-   [ ] Unit tests for repositories (happy path + error cases)
    -   Requirements: 6, 8, 10
-   [ ] Integration test: create → transition → events → sign URLs
    -   Requirements: 1, 2, 5, 6
-   [ ] Cleanup test: insert expired rows → run cleanup → verify DB and storage
    -   Requirements: 4

## 7. Observability

-   [ ] Emit metrics: repo operation durations, error counts
    -   Requirements: 10
-   [ ] Structured logs with jobId correlation
    -   Requirements: 2, 10

## 8. Security

-   [ ] Hash API keys with Argon2/Bcrypt; never store plaintext
    -   Requirements: 3, 9
-   [ ] Ensure parameterized queries and secret redaction in errors
    -   Requirements: 9
