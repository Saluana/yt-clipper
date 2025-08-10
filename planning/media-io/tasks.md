<!-- artifact_id: 4e1d8c6a-5e5e-42f2-9f8f-1c9f49a1c7de -->

# tasks.md — Media IO (Source Resolver)

## 1. Scaffolding & Config

-   [x] Add `SCRATCH_DIR` to common config with sane default (`/tmp/ytc`).
-   [x] Define envs: `ENABLE_YTDLP`, `MAX_INPUT_MB`, `MAX_CLIP_INPUT_DURATION_SEC`, `ALLOWLIST_HOSTS`.
-   [x] Export a `SourceResolver` interface in `@clipper/data` or a new `media-io` package.

## 2. Implement Resolver (upload path)

-   [x] Create per-job scratch dir `${SCRATCH_DIR}/sources/{jobId}`.
-   [x] Implement Supabase download streaming to `source.<ext>`.
-   [x] Emit metrics: `mediaio.download.bytes`.
-   [x] Return `{ localPath, cleanup, meta }` after ffprobe validation.
-   Requirements: 1, 4, 5, 6

## 3. Implement Resolver (YouTube path — gated)

-   [x] Add gate check: reject with `YTDLP_DISABLED` when disabled.
-   [x] Implement SSRF guard (scheme, IP class, optional allowlist).
-   [x] Shell out to `yt-dlp` with guarded flags and output template.
-   [x] Enforce size/timeout; pick resulting file path.
-   [x] ffprobe validation and return.
-   Requirements: 2, 3, 4, 6

## 4. ffprobe Meta & Caps

-   [ ] Exec ffprobe JSON; parse duration, size, container.
-   [ ] Enforce `MAX_CLIP_INPUT_DURATION_SEC` and `MAX_INPUT_MB`.
-   [ ] On violation: cleanup and return `INPUT_TOO_LARGE`.
-   Requirements: 4, 6

## 5. Cleanup & Idempotency

-   [ ] If file already exists and passes caps: reuse; else overwrite.
-   [ ] Provide cleanup() that recursively removes the scratch dir.
-   Requirements: 5

## 6. Telemetry & Logging

-   [ ] Wrap resolve() with timer and structured logs.
-   [ ] Emit: `mediaio.resolve.duration_ms`, `mediaio.ffprobe.duration_ms`, `mediaio.ytdlp.duration_ms`.
-   [ ] Ensure redaction layer is applied to any URL logs.
-   Requirements: 6, Security

## 7. Tests

-   [ ] Unit tests for gating, SSRF, cap enforcement, and cleanup.
-   [ ] Integration tests (optional, guarded by envs) for upload download and yt-dlp path.
-   Requirements: Testing Strategy

## 8. Wiring & Docs

-   [ ] Export resolver from package index and wire into worker pipeline before clipper.
-   [ ] Update planning docs and READMEs with usage and envs.
-   [ ] Add a small smoke test in worker to call resolver with a seeded upload.

---

Mappings:

-   Req 1 → Tasks 2,4,5
-   Req 2 → Task 3
-   Req 3 → Task 3
-   Req 4 → Task 4
-   Req 5 → Task 5
-   Req 6 → Task 6
