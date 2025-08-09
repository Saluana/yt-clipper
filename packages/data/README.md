# @clipper/data

Data layer (Drizzle + Postgres) and Supabase Storage helpers.

## Prereqs

-   Bun loads `.env` automatically
-   Required envs:
    -   DATABASE_URL (for Postgres)
    -   SUPABASE_URL
    -   SUPABASE_SERVICE_ROLE_KEY
    -   SUPABASE_STORAGE_BUCKET (optional; bootstrap can create and use it)

## Migrations

-   Generate from schema:
    -   bun run --cwd packages/data db:generate
-   Apply to DB:
    -   bun run --cwd packages/data db:push

## Seed

-   Minimal seed inserts a queued job:
    -   bun run --cwd packages/data db:seed

## Storage Bootstrap

-   Ensures bucket exists and creates `sources/.keep` and `results/.keep`:
    -   bun run --cwd packages/data storage:bootstrap

## Tests

-   Run the full suite from repo root:
    -   bunx vitest -c vitest.config.ts
