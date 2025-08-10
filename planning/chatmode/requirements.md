<!-- artifact_id: 7f84a2f6-24d5-4a3e-9b8b-1d3f93f3d5b1 -->

# requirements.md — Task 1: Media IO scaffolding

## Introduction

Set up environment variables and core types required by the Media IO Source Resolver so subsequent implementation can proceed safely and consistently.

## Functional Requirements

1. Config and env keys

-   As a developer, I want new Media IO env keys added to common config, so the resolver can read them in a typed, validated way.
    -   Acceptance Criteria:
        -   WHEN loading config THEN system SHALL accept SCRATCH_DIR, ENABLE_YTDLP, MAX_INPUT_MB, MAX_CLIP_INPUT_DURATION_SEC, ALLOWLIST_HOSTS with defaults.

2. Types export

-   As a developer, I want SourceResolver/ResolveResult types exported from the data package, so downstream code can depend on stable contracts.
    -   Acceptance Criteria:
        -   WHEN importing from @clipper/data THEN types SHALL be available.

3. Developer envs

-   As an operator, I want .env and .env.example updated with safe defaults, so local and CI runs configure consistently.
    -   Acceptance Criteria:
        -   New keys present with comments and defaults; no secrets leaked additionally.

## Non-Functional

-   Backward compatible with existing packages.
-   Build passes across workspace.

## Acceptance Summary

-   New envs wired in config, sample env files updated, types exported, build green.
