# yt-clipper

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.18. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Environment Variables (R2)

The Foundations config loader (`@clipper/common/config`) validates these env vars. Bun automatically loads `.env`.

-   NODE_ENV: development | test | production (default: development)
-   LOG_LEVEL: debug | info | warn | error (default: info)
-   SUPABASE_URL: Supabase project URL (required)
-   SUPABASE_ANON_KEY: Supabase anon/service key (required)
-   QUEUE_URL: Queue/DB URL (optional; e.g., Postgres conn string)
-   ENABLE_YTDLP: Enable YouTube resolver (default: false)
-   CLIP_MAX_DURATION_SEC: Max clip duration in seconds (default: 120)
-   ENABLE_OPENAPI: If 'true', allows generating OpenAPI from contracts (optional)

Example `.env`:

```env
NODE_ENV=development
LOG_LEVEL=debug
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=replace-with-key
QUEUE_URL=postgres://user:pass@localhost:5432/clipper
ENABLE_YTDLP=false
CLIP_MAX_DURATION_SEC=120
# Optional
ENABLE_OPENAPI=false
```
