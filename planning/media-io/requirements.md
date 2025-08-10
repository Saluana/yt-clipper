<!-- artifact_id: 9a0d7c1a-9e1c-4a4a-9d5a-3f1b1f7b3e4d -->

# requirements.md — Media IO (Source Resolver)

## Introduction

Implement a robust Media IO layer that resolves an input source (upload or optional YouTube) to a local NVMe file for downstream FFmpeg processing. Enforce SSRF protections, size/duration caps via ffprobe, and integrate with Supabase Storage for uploads. Designed to operate under Bun/Node workers with predictable performance and security.

---

## Functional Requirements

1. Source Resolution — Uploads

-   As a worker, I want to download a job's uploaded source object from Supabase Storage to local NVMe, so that FFmpeg can read from a fast local path.
    -   Acceptance Criteria:
        -   WHEN job.sourceType = 'upload' AND sourceKey is set THEN resolver SHALL download `bucket/sources/{jobId}/source.*` to `${SCRATCH_DIR}/sources/{jobId}/source.*` and return { localPath, cleanup }.
        -   IF the object is missing THEN resolver SHALL return a NOT_FOUND error with code `SOURCE_NOT_FOUND`.

2. Source Resolution — YouTube (Optional)

-   As an operator, I want YouTube fetching to be explicitly gated, so that ToS risks are mitigated.
    -   Acceptance Criteria:
        -   IF ENABLE_YTDLP != 'true' THEN resolver SHALL reject YouTube sources with `YTDLP_DISABLED`.
        -   WHEN enabled, resolver SHALL invoke `yt-dlp` to fetch video to `${SCRATCH_DIR}/sources/{jobId}/source.mp4` (or best container), honoring size cap.

3. SSRF Guard & Allowlist

-   As a platform, I want to block SSRF and untrusted fetches, so that internal services aren’t probed.
    -   Acceptance Criteria:
        -   IF source is a URL (YouTube or otherwise) THEN resolver SHALL validate scheme http(s) only and reject private IPs, link-local, and loopback targets; optional ALLOWLIST_HOSTS env.

4. Size/Duration Caps via ffprobe

-   As a worker, I want to ensure inputs are within configured bounds, so that expensive jobs are rejected early.
    -   Acceptance Criteria:
        -   WHEN a source is resolved THEN resolver SHALL run `ffprobe` to retrieve duration, bitrate, and container info.
        -   IF duration > MAX_CLIP_INPUT_DURATION_SEC or file size > MAX_INPUT_MB THEN resolver SHALL return `INPUT_TOO_LARGE`.

5. Cleanup Contract

-   As an operator, I want temporary files cleaned up, so that NVMe space is recycled.
    -   Acceptance Criteria:
        -   Resolver SHALL return a `cleanup()` that deletes the temp directory tree; on fatal errors, partial files SHALL be removed.

6. Telemetry & Errors

-   As a developer, I need structured logs and metrics for visibility.
    -   Acceptance Criteria:
        -   Resolver SHALL log start/finish with jobId and timing; redact sensitive fields.
        -   Resolver SHALL emit metrics: `mediaio.resolve.duration_ms`, `mediaio.download.bytes`, `mediaio.ytdlp.duration_ms`, `mediaio.ffprobe.duration_ms`.

---

## Non-Functional Requirements

-   Performance: downloads and yt-dlp should stream to disk with backpressure; avoid buffering entire files in memory.
-   Security: never log full URLs or tokens; apply redaction layer.
-   Portability: run under Bun or Node; shell out to `yt-dlp` and `ffprobe` with safe args.
-   Idempotency: if file already exists and passes caps, reuse it.

---

## Dependencies

-   Supabase Storage service role key (server-side only)
-   ffprobe and optionally yt-dlp installed in PATH on worker nodes
-   @clipper/common for logger, metrics, env

---

## Acceptance Summary

-   Given a job, resolver returns a local file path or a clear error code without leaking secrets; respects feature gates and size/duration limits; cleans up after itself.
