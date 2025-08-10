<!-- artifact_id: a6a4c140-6e4a-4b1a-8d3f-9a0e1c8b1f3a -->

# design.md — Task 1: Media IO scaffolding

## Overview

Define and validate environment variables that the Media IO layer will use, plus publish minimal interfaces for the resolver, without implementing behavior yet.

## Components

-   Common Config (packages/common/src/config.ts)
    -   Adds: SCRATCH_DIR, MAX_INPUT_MB, MAX_CLIP_INPUT_DURATION_SEC, ALLOWLIST_HOSTS, ENABLE_YTDLP (existing) with parsing.
-   Data package types (packages/data/src/media-io.ts)
    -   Exports SourceResolver and ResolveResult.

## Error Handling

-   Config loader rejects invalid types; defaults applied for absent optional values.

## Testing

-   Build check as smoke validation. Follow-ups: add unit tests asserting defaults for new keys when absent.
