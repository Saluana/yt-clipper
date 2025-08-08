artifact_id: 2a4bba3e-6fe6-45e2-89ab-72d6396e8a35

# Foundations (Contracts & Utilities) — Tasks

## 1. Package scaffolding

-   [x] Create workspaces in package.json for `@clipper/contracts` and `@clipper/common` (Requirements: R7)
-   [x] Initialize tsconfig bases for both packages (TS5, ESM) (R7)
-   [x] Set up Bun/TS build scripts and test runner (R7)

## 2. @clipper/contracts

-   [x] Implement domain types in `src/types.ts` (R1)
-   [x] Implement Zod schemas in `src/schemas.ts` with cross-field validation (R1)
-   [x] Add barrel exports `src/index.ts` (R1)
-   [x] (Optional) Implement OpenAPI generator `src/openapi.ts` guarded by env flag (R1)
-   [x] Unit tests: valid/invalid CreateJobInput, JobRecord round-trip (R1)

## 3. @clipper/common — Config

-   [x] Implement `ConfigSchema` and `loadConfig()` with defaults and redaction (R2)
-   [x] Unit tests: missing required, invalid values, test env defaults (R2)

## 4. @clipper/common — Logger

-   [x] Implement `createLogger()` with `.with()` scoping and level filtering (R3)
-   [ ] Unit tests: level gating, field inheritance, error logging (R3)

## 5. @clipper/common — Error handling

-   [x] Define `ServiceError`, `ErrorEnvelope`, and `ServiceResult` helpers (R4)
-   [ ] Unit tests: fromException mapping, pattern matching ok/err (R4)

## 6. @clipper/common — Time utilities

-   [x] Implement `parseTimecode`, `formatTimecode`, and `validateRange` (R5)
-   [x] Unit tests: edge cases (00:00:00, ms precision, negative, over-cap) (R5)

## 7. @clipper/common — Job state machine

-   [x] Implement `transition(current, to, reason?)` + allowed map (R6)
-   [ ] Unit tests: allowed transitions, invalid transitions, idempotent terminal (R6)

## 8. DX & Packaging

-   [ ] Configure linting and formatting (eslint, prettier) minimal rules (R7)
-   [x] Ensure exports are ESM and tree-shakeable, add `exports` maps (R7)
-   [ ] Add minimal READMEs for both packages (R7)

## 9. Examples & Docs

-   [ ] Add example payloads and round-trip validation scripts in repo root or examples/ (R1, R5)
-   [x] Document environment variables in README (R2)

---

## Task–Requirement Mapping

-   Section 2 → R1
-   Section 3 → R2
-   Section 4 → R3
-   Section 5 → R4
-   Section 6 → R5
-   Section 7 → R6
-   Sections 1, 8, 9 → R7
