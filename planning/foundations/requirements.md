artifact_id: 6d6b1b64-8f54-48b9-9c94-3da68b0e8fd2

# Foundations (Contracts & Utilities) — Requirements

## Introduction

The Foundations layer establishes shared contracts (TypeScript types + Zod schemas) and common utilities (config loader, logger, error envelope, time utils, and a job state machine). It must be lightweight, dependency-minimal, and reusable across API, Worker, Queue, and Data layers.

Primary goals:

-   Single source of truth for request/response and domain types
-   Strict validation and consistent error envelopes
-   Deterministic job state transitions
-   Reliable env/config loading and time parsing utilities

Success criteria (DoD): Types compile, schemas validate, and example payloads round-trip.

## Requirements

### R1. Contracts package (`@clipper/contracts`)

As a developer, I want shared domain types and Zod schemas, so that all services can rely on a single source of truth.

Acceptance Criteria:

-   WHEN a service imports `CreateJobInput`, `JobRecord`, `JobStatus`, `SourceType` THEN it SHALL compile without type errors.
-   WHEN a service validates `CreateJobInput` with Zod THEN valid inputs SHALL pass and invalid inputs (e.g., malformed timecodes, start >= end) SHALL fail with descriptive issues.
-   WHEN a `JobRecord` is serialized and parsed with its schema THEN it SHALL round-trip without loss.
-   IF OpenAPI generation is enabled via env flag THEN the package SHALL emit an OpenAPI JSON that matches the Zod schemas; otherwise it SHALL skip without impacting runtime.

### R2. Common package (`@clipper/common`) — Config Loader

As an operator, I want a typed, validated configuration loader, so that services fail fast and run with safe defaults.

Acceptance Criteria:

-   WHEN the process starts with required env vars present THEN `loadConfig()` SHALL return a typed config object.
-   IF a required env var is missing or invalid THEN `loadConfig()` SHALL throw a descriptive error before the app starts listening/processing.
-   WHEN optional envs are absent THEN defaults SHALL be applied as specified in the schema.
-   WHEN `NODE_ENV` is `test` THEN the loader SHALL allow test-safe defaults and override patterns.

### R3. Common package — Logger

As a developer, I want structured logs with correlation support, so that I can trace requests and jobs.

Acceptance Criteria:

-   WHEN `logger.with({ jobId })` is used THEN subsequent logs SHALL include the `jobId` field.
-   WHEN `LOG_LEVEL` is set THEN the logger SHALL respect it (e.g., debug|info|warn|error).
-   WHEN logging errors via helper THEN it SHALL include message, code, and cause stack (if present) without leaking secrets.

### R4. Common package — Error Envelope

As a client or service, I want a consistent error envelope, so that I can handle errors deterministically.

Acceptance Criteria:

-   WHEN an error occurs THEN responses (or internal results) SHALL use `{ code, message, details?, correlationId? }`.
-   WHEN converting exceptions to envelopes THEN known `ServiceError` codes SHALL map to stable `code` strings and HTTP statuses (for API layer use).
-   WHEN using `ServiceResult` helpers THEN consumers SHALL be able to pattern-match success or error without throwing.

### R5. Common package — Time Utilities

As a developer, I want reliable time parsing/formatting utilities for clip ranges, so that inputs are validated and safe.

Acceptance Criteria:

-   WHEN parsing `HH:MM:SS(.ms)` THEN `parseTimecode()` SHALL return seconds as a number within precision tolerance.
-   WHEN formatting seconds THEN `formatTimecode()` SHALL output `HH:MM:SS.mmm` (no trailing ms if 0).
-   WHEN validating a clip range THEN `validateRange(start, end, { maxDurationSec })` SHALL ensure `start < end` and duration <= cap, returning typed results.

### R6. Common package — Job State Machine

As a worker service, I want a strict job state machine, so that invalid transitions are prevented and events are clear.

Acceptance Criteria:

-   GIVEN states `queued → processing → done|failed` THEN only these transitions SHALL be permitted; all others SHALL be rejected with a specific error code.
-   WHEN a transition occurs THEN a transition object `{ from, to, at, reason? }` SHALL be produced for persistence/audit.
-   WHEN the same terminal state is re-applied idempotently THEN the transition helper SHALL treat it as a no-op success.

### R7. Developer Experience & Packaging

As a contributor, I want packages that are easy to import, test, and version, so that development is fast and reliable.

Acceptance Criteria:

-   WHEN installing the repo THEN `@clipper/contracts` and `@clipper/common` SHALL build (tsc) with no type errors.
-   WHEN running unit tests THEN schemas, state machine, and utilities SHALL pass happy-path and edge cases.
-   WHEN publishing (or linking) packages THEN their exports SHALL be tree-shakeable and ESM-compatible.

### Non-Functional Requirements

-   Reliability: Validation failures must be deterministic and human-readable.
-   Performance: Schema parsing and time utils add negligible overhead (<1ms typical per call for average-sized payloads).
-   Security: Config loader redacts secrets in logs; error envelopes do not leak sensitive env values.
-   Compatibility: TypeScript ≥ 5, Node/Bun ESM; zero or minimal runtime deps.
-   Observability: Logger includes correlation, structured fields, and supports JSON output.
